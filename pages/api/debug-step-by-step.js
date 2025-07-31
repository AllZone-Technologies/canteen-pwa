import db from "../../models";
import AutoMealDeductions from "../../lib/serverOnly/autoMealDeductions";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("=== Step-by-step debug ===");

    // Step 1: Test database connection
    console.log("Step 1: Testing database connection...");
    await db.sequelize.authenticate();
    console.log("✅ Database connection successful");

    // Step 2: Check meal deductions
    console.log("Step 2: Checking meal deductions...");
    const mealDeductions = await db.MealDeduction.findAll({
      limit: 5,
      order: [["created_at", "DESC"]],
    });
    console.log(`✅ Found ${mealDeductions.length} meal deductions`);

    // Step 3: Test AutoMealDeductions class
    console.log("Step 3: Testing AutoMealDeductions class...");
    const autoMealDeductions = new AutoMealDeductions();
    console.log("✅ AutoMealDeductions class created");

    // Step 4: Test period calculation
    console.log("Step 4: Testing period calculation...");
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let periodStart, periodEnd;

    if (currentDay >= 21) {
      periodStart = new Date(currentYear, currentMonth, 21);
      periodEnd = new Date(currentYear, currentMonth + 1, 20);
    } else {
      periodStart = new Date(currentYear, currentMonth - 1, 21);
      periodEnd = new Date(currentYear, currentMonth, 20);
    }

    console.log(
      `✅ Period calculated: ${periodStart.toDateString()} to ${periodEnd.toDateString()}`
    );

    // Step 5: Test meal deductions query
    console.log("Step 5: Testing meal deductions query...");
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const deductions = await db.MealDeduction.findAll({
      where: {
        date: {
          [db.Sequelize.Op.between]: [
            formatDate(periodStart),
            formatDate(periodEnd),
          ],
        },
      },
    });

    console.log(`✅ Found ${deductions.length} deductions for current period`);

    // Step 6: Test CSV generation
    console.log("Step 6: Testing CSV generation...");
    const csvContent = autoMealDeductions.generateCSVContent(deductions);
    console.log(`✅ CSV generated with ${csvContent.length} characters`);

    // Step 7: Test file saving
    console.log("Step 7: Testing file saving...");
    const filename = autoMealDeductions.generateFilename();
    console.log(`✅ Filename generated: ${filename}`);

    const saved = await autoMealDeductions.networkService.saveFileToNetwork(
      csvContent,
      filename
    );
    console.log(`✅ File save result: ${saved}`);

    res.status(200).json({
      success: true,
      steps: {
        databaseConnection: true,
        mealDeductionsFound: mealDeductions.length,
        autoMealDeductionsCreated: true,
        periodCalculated: true,
        deductionsForPeriod: deductions.length,
        csvGenerated: csvContent.length > 0,
        filenameGenerated: filename,
        fileSaved: saved,
      },
      message: "Step-by-step debug completed",
    });
  } catch (error) {
    console.error("Error in step-by-step debug:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}
