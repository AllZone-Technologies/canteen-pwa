import db from "../../models";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Verify database connection
    await db.sequelize.authenticate();
    console.log("Database connection verified");

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
      console.log(
        "Looking for employee with ID:",
        employeeId,
        "Type:",
        typeof employeeId
      );
      employee = await db.Employee.findOne({
        where: { employee_id: String(employeeId) },
      });
      console.log(
        "Employee found:",
        employee ? employee.employee_id : "Not found"
      );
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

    // Check if entity has checked in within the last hour (for both QR and manual)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    console.log("Checking restriction for entity:", entityId);
    console.log("One hour ago:", oneHourAgo);

    const recentCheckIn = await db.VisitLog.findOne({
      where: {
        employee_id: entityId,
        checkin_time: {
          [db.Sequelize.Op.gte]: oneHourAgo,
        },
      },
      order: [["checkin_time", "DESC"]],
    });

    console.log(
      "Recent checkin found:",
      recentCheckIn
        ? {
            employee_id: recentCheckIn.employee_id,
            checkin_time: recentCheckIn.checkin_time,
            source_type: recentCheckIn.source_type,
          }
        : "None"
    );

    // If this is just a check and entity has checked in recently
    if (checkOnly && recentCheckIn) {
      return res.status(200).json({
        alreadyCheckedIn: true,
        employeeId: entityId,
        lastCheckInTime: recentCheckIn.checkin_time,
        entityType: employee ? "employee" : "contractor",
        message: `${entityName} has already checked in within the last hour`,
      });
    }

    // If entity has checked in recently and this is not just a check
    if (recentCheckIn && !checkOnly) {
      const timeSinceLastCheckIn =
        new Date() - new Date(recentCheckIn.checkin_time);
      const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
      const timeRemaining = oneHourInMs - timeSinceLastCheckIn;

      if (timeRemaining > 0) {
        const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));
        const secondsRemaining = Math.ceil(timeRemaining / 1000);

        let timeMessage;
        if (minutesRemaining >= 1) {
          timeMessage = `${entityName} has already checked in. Please wait ${minutesRemaining} minute${
            minutesRemaining > 1 ? "s" : ""
          } before checking in again`;
        } else {
          timeMessage = `${entityName} has already checked in. Please wait ${secondsRemaining} second${
            secondsRemaining > 1 ? "s" : ""
          } before checking in again`;
        }

        return res.status(400).json({
          message: timeMessage,
          employeeId: entityId,
          lastCheckInTime: recentCheckIn.checkin_time,
          entityType: employee ? "employee" : "contractor",
          timeRemaining: timeRemaining,
          canCheckInAfter: new Date(
            new Date(recentCheckIn.checkin_time).getTime() + oneHourInMs
          ),
          isRestricted: true,
        });
      }
    }

    // If this is just a check and entity hasn't checked in recently
    if (checkOnly) {
      return res.status(200).json({
        alreadyCheckedIn: false,
        employeeId: entityId,
        entityType: employee ? "employee" : "contractor",
        message: `${entityName} can check in now`,
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
      message: `${entityName} checked in successfully at ${new Date().toLocaleTimeString()}`,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
