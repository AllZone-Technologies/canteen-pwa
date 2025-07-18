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
      include: [
        {
          model: db.Employee,
          as: "Employee",
          attributes: ["employee_id", "firstname", "lastname"],
        },
      ],
      order: [["checkin_time", "DESC"]],
    });

    res.status(200).json({
      mealDeductions: mealDeductions.map((d) => ({
        id: d.id,
        employee_id: d.employee_id,
        amount: d.amount,
        date: d.date,
        visit_count: d.visit_count,
        created_at: d.created_at,
      })),
      visitLogs: visitLogs.map((v) => ({
        id: v.id,
        employee_id: v.employee_id,
        checkin_time: v.checkin_time,
        employee: v.Employee
          ? {
              employee_id: v.Employee.employee_id,
              name: `${v.Employee.firstname} ${v.Employee.lastname}`,
            }
          : null,
      })),
      today: today,
    });
  } catch (error) {
    console.error("Test error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}
