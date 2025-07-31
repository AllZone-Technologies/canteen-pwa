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

    // Parse dates and convert to period format (similar to above)
    const monthNames = [
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

    // Calculate periods that fall within the date range
    const periods = [];
    let currentDate = new Date(start);
    const endDateObj = new Date(end);

    while (currentDate <= endDateObj) {
      const currentDay = currentDate.getDate();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      let periodStart, periodEnd;

      if (currentDay >= 21) {
        periodStart = new Date(currentYear, currentMonth, 21);
        periodEnd = new Date(currentYear, currentMonth + 1, 20);
      } else {
        periodStart = new Date(currentYear, currentMonth - 1, 21);
        periodEnd = new Date(currentYear, currentMonth, 20);
      }

      const periodString = `${periodStart.getDate()} ${
        monthNames[periodStart.getMonth()]
      } ${periodStart.getFullYear()} - ${periodEnd.getDate()} ${
        monthNames[periodEnd.getMonth()]
      } ${periodEnd.getFullYear()}`;

      if (!periods.includes(periodString)) {
        periods.push(periodString);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get meal deductions for the periods
    const mealDeductions = await db.MealDeduction.findAll({
      where: {
        date: {
          [db.Sequelize.Op.in]: periods,
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
      // For CSV, use the end date of the period (20th of the month)
      const periodParts = deduction.date.split(" - ");
      const endDatePart = periodParts[1]; // "20 February 2024"
      const endDateParts = endDatePart.split(" ");
      const day = endDateParts[0];
      const month = monthNames.indexOf(endDateParts[1]) + 1;
      const year = endDateParts[2];
      const formattedDate = `${day}.${String(month).padStart(2, "0")}.${year}`;

      // Format amount to 2 decimal places
      const formattedAmount = parseFloat(deduction.amount).toFixed(2);

      // Add row to CSV
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
