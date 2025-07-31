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

    // Parse dates and convert to period format
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

      // Move to next day
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

    // Format the response data
    const formattedDeductions = mealDeductions.map((deduction) => ({
      employee_id: deduction.employee_id,
      wage_type: deduction.wage_type,
      amount: parseFloat(deduction.amount),
      date: deduction.date,
      currency: deduction.currency,
      visit_count: deduction.visit_count,
    }));

    res.status(200).json({
      success: true,
      data: formattedDeductions,
      message: `Found ${formattedDeductions.length} meal deductions`,
    });
  } catch (error) {
    console.error("Error generating meal deductions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
