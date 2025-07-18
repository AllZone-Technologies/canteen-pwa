import db from "../../../../models";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Get meal deductions for the date range
    const mealDeductions = await db.MealDeduction.findAll({
      where: {
        date: {
          [db.Sequelize.Op.between]: [start, end],
        },
      },
      include: [
        {
          model: db.Employee,
          as: "Employee",
          attributes: ["employee_id", "firstname", "lastname"],
        },
      ],
      order: [
        ["date", "ASC"],
        ["employee_id", "ASC"],
      ],
    });

    // Generate CSV content
    let csvContent = "Emp#,Wage type,Amount,Date,Currency\n";

    mealDeductions.forEach((deduction) => {
      // Format date as DD.MM.YYYY
      const date = new Date(deduction.date);
      const formattedDate = `${String(date.getDate()).padStart(
        2,
        "0"
      )}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;

      // Format amount to 2 decimal places
      const formattedAmount = parseFloat(deduction.amount).toFixed(2);

      // Add row to CSV (no blank lines or special characters)
      csvContent += `${deduction.employee_id},${deduction.wage_type},${formattedAmount},${formattedDate},${deduction.currency}\n`;
    });

    // Generate filename with current date in DD.MM.YYYY format
    const today = new Date();
    const filename = `${String(today.getDate()).padStart(2, "0")}.${String(
      today.getMonth() + 1
    ).padStart(2, "0")}.${today.getFullYear()}.csv`;

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-cache");

    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error downloading meal deductions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
