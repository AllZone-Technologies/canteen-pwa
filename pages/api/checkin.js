import db from "../../models";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const {
      qrCodeData,
      qrCode,
      employeeId,
      contractorId,
      sourceType = "QR",
      checkOnly = false,
      guestCount = 0,
    } = req.body;

    // Handle both qrCode and qrCodeData parameters for backward compatibility
    const qrCodeValue = qrCodeData || qrCode;

    if (!qrCodeValue && !employeeId && !contractorId) {
      return res.status(400).json({
        message: "QR code data, employee ID, or contractor ID is required",
      });
    }

    let employee = null;
    let contractor = null;
    let checkInEntity = null;

    if (qrCodeValue) {
      // First try to find employee by QR code data
      employee = await db.Employee.findOne({
        where: { qr_code_data: qrCodeValue },
      });

      // If not found, try to find contractor by QR code data
      if (!employee) {
        contractor = await db.Contractor.findOne({
          where: { qr_code_data: qrCodeValue, is_active: true },
        });
      }

      checkInEntity = employee || contractor;
    } else if (employeeId) {
      // Find employee by ID (for manual check-in)
      employee = await db.Employee.findOne({
        where: { employee_id: String(employeeId) },
      });
      checkInEntity = employee;
    } else if (contractorId) {
      // Find contractor by ID (for manual check-in)
      contractor = await db.Contractor.findByPk(contractorId);
      if (contractor && contractor.is_active) {
        checkInEntity = contractor;
      }
    }

    if (!checkInEntity) {
      return res
        .status(404)
        .json({ message: "Employee or contractor not found" });
    }

    // Determine the identifier for the check-in
    const entityId = employee
      ? employee.employee_id
      : `CONTRACTOR_${contractor.id}`;
    const entityName = employee
      ? `${employee.firstname} ${employee.lastname}`
      : contractor.company_name;

    // Check if entity has checked in within the last minute
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    const recentCheckIn = await db.VisitLog.findOne({
      where: {
        employee_id: entityId,
        checkin_time: {
          [db.Sequelize.Op.gte]: oneMinuteAgo,
        },
      },
      order: [["checkin_time", "DESC"]],
    });

    // If this is just a check and entity has checked in recently
    if (checkOnly && recentCheckIn) {
      return res.status(200).json({
        alreadyCheckedIn: true,
        employeeId: entityId,
        lastCheckInTime: recentCheckIn.checkin_time,
        entityType: employee ? "employee" : "contractor",
      });
    }

    // If entity has checked in recently and this is not just a check
    if (recentCheckIn && !checkOnly) {
      const timeSinceLastCheckIn =
        new Date() - new Date(recentCheckIn.checkin_time);
      const secondsRemaining = Math.ceil((60000 - timeSinceLastCheckIn) / 1000);

      return res.status(400).json({
        message: `Please wait ${secondsRemaining} more seconds before checking in again`,
        employeeId: entityId,
        lastCheckInTime: recentCheckIn.checkin_time,
        entityType: employee ? "employee" : "contractor",
      });
    }

    // If this is just a check and entity hasn't checked in recently
    if (checkOnly) {
      return res.status(200).json({
        alreadyCheckedIn: false,
        employeeId: entityId,
        entityType: employee ? "employee" : "contractor",
      });
    }

    // Create new check-in record
    const visitLog = await db.VisitLog.create({
      employee_id: entityId,
      username: entityName,
      checkin_time: new Date(),
      source_type: sourceType,
      guest_count: guestCount,
    });

    // Create meal deduction for employees only (not contractors)
    if (employee) {
      try {
        // Calculate deduction period: 21st to 20th of next month
        const checkInDate = new Date();
        const currentDay = checkInDate.getDate();
        const currentMonth = checkInDate.getMonth();
        const currentYear = checkInDate.getFullYear();

        let deductionPeriodStart, deductionPeriodEnd;

        if (currentDay >= 21) {
          // If it's 21st or later, period is current month 21st to next month 20th
          deductionPeriodStart = new Date(currentYear, currentMonth, 21);
          deductionPeriodEnd = new Date(currentYear, currentMonth + 1, 20);
        } else {
          // If it's before 21st, period is previous month 21st to current month 20th
          deductionPeriodStart = new Date(currentYear, currentMonth - 1, 21);
          deductionPeriodEnd = new Date(currentYear, currentMonth, 20);
        }

        // Format the deduction period for the database record
        const formatPeriod = (startDate, endDate) => {
          const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];

          const startDay = startDate.getDate();
          const startMonth = months[startDate.getMonth()];
          const startYear = startDate.getFullYear();

          const endDay = endDate.getDate();
          const endMonth = months[endDate.getMonth()];
          const endYear = endDate.getFullYear();

          return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
        };

        const deductionPeriod = formatPeriod(
          deductionPeriodStart,
          deductionPeriodEnd
        );

        const mealDeductionPerVisit = 5; // 5 QAR per visit only
        const totalDeductionForThisVisit = mealDeductionPerVisit; // No guest charges

        // Check if meal deduction already exists for this employee and period
        const existingDeduction = await db.MealDeduction.findOne({
          where: {
            employee_id: entityId,
            date: deductionPeriod,
          },
        });

        if (existingDeduction) {
          // Get all visit logs for this employee in the current period to recalculate total
          const allVisitLogs = await db.VisitLog.findAll({
            where: {
              employee_id: entityId,
              checkin_time: {
                [db.Sequelize.Op.gte]: deductionPeriodStart,
                [db.Sequelize.Op.lte]: deductionPeriodEnd,
              },
            },
          });

          // Calculate total amount based on all visits
          let totalAmount = 0;
          let totalVisits = 0;

          allVisitLogs.forEach((visit) => {
            const visitAmount = mealDeductionPerVisit; // 5 QAR per visit only
            totalAmount += visitAmount; // No guest charges
            totalVisits++;
          });

          await existingDeduction.update({
            amount: totalAmount,
            visit_count: totalVisits,
          });
          console.log(
            `Updated meal deduction for ${entityId} for period ${deductionPeriod}: ${totalAmount} QAR (${totalVisits} visits total)`
          );
        } else {
          // Create new deduction
          await db.MealDeduction.create({
            employee_id: entityId,
            wage_type: "3020",
            amount: totalDeductionForThisVisit,
            date: deductionPeriod,
            currency: "QAR",
            visit_count: 1,
          });
          console.log(
            `Created meal deduction for ${entityId} for period ${deductionPeriod}: ${totalDeductionForThisVisit} QAR (1 visit, guests are free)`
          );
        }
      } catch (deductionError) {
        console.error("Error creating meal deduction:", deductionError);
        // Don't fail the check-in if meal deduction fails
      }
    }

    const responseData = employee
      ? {
          firstname: employee.firstname,
          lastname: employee.lastname,
          employee_id: employee.employee_id,
          department: employee.department,
        }
      : {
          company_name: contractor.company_name,
          contact_person: contractor.contact_person,
          contractor_id: contractor.id,
        };

    res.status(200).json({
      success: true,
      visitLog,
      data: responseData,
      entityType: employee ? "employee" : "contractor",
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
