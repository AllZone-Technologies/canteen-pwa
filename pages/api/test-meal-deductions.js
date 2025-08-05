import db from "../../models";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get all meal deductions
    const mealDeductions = await db.MealDeduction.findAll({
      order: [["created_at", "DESC"]],
    });

    // Get all visit logs for today
    const today = new Date().toISOString().split("T")[0];
    const visitLogs = await db.VisitLog.findAll({
      where: {
        checkin_time: {
          [db.Sequelize.Op.gte]: new Date(today),
        },
      },
      order: [["checkin_time", "DESC"]],
    });

    // Get all unique employee IDs from the visit logs
    const employeeIds = [
      ...new Set(
        visitLogs
          .filter((visitLog) => !visitLog.employee_id.startsWith("CONTRACTOR_"))
          .map((visitLog) => visitLog.employee_id)
      ),
    ];

    // Fetch employee data for all employee IDs at once
    const employees = await db.Employee.findAll({
      where: {
        employee_id: {
          [db.Sequelize.Op.in]: employeeIds,
        },
      },
      attributes: ["employee_id", "firstname", "lastname"],
    });

    // Create a map for quick employee lookup
    const employeeMap = employees.reduce((map, employee) => {
      map[employee.employee_id] = employee;
      return map;
    }, {});

    res.status(200).json({
      mealDeductions: mealDeductions.map((d) => ({
        id: d.id,
        employee_id: d.employee_id,
        amount: d.amount,
        date: d.date,
        visit_count: d.visit_count,
        created_at: d.created_at,
      })),
      visitLogs: visitLogs.map((v) => {
        let employee = null;
        if (v.employee_id.startsWith("CONTRACTOR_")) {
          // This is a contractor
          employee = {
            employee_id: v.employee_id,
            name: v.username || "Contractor",
          };
        } else {
          // This is an employee
          const emp = employeeMap[v.employee_id];
          if (emp) {
            employee = {
              employee_id: emp.employee_id,
              name: `${emp.firstname} ${emp.lastname}`,
            };
          }
        }

        return {
          id: v.id,
          employee_id: v.employee_id,
          checkin_time: v.checkin_time,
          employee: employee,
        };
      }),
      today: today,
    });
  } catch (error) {
    console.error("Test error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}
