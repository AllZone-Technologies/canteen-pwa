import db from "../../models";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get all meal deductions to see the actual data
    const mealDeductions = await db.MealDeduction.findAll({
      limit: 5,
      order: [["created_at", "DESC"]],
      raw: true, // Get raw data without Sequelize model instances
    });

    console.log("Raw meal deductions data:", mealDeductions);

    res.status(200).json({
      success: true,
      mealDeductions: mealDeductions,
      count: mealDeductions.length,
    });
  } catch (error) {
    console.error("Error getting meal deductions:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
