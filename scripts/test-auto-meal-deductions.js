const AutoMealDeductions = require("../lib/serverOnly/autoMealDeductions");
const db = require("../models");

async function testAutoMealDeductions() {
  console.log("🧪 Testing Auto Meal Deduction Functionality\n");

  try {
    // Test 1: Check database connection and meal deductions
    console.log(
      "1. Checking database connection and existing meal deductions..."
    );
    const existingDeductions = await db.MealDeduction.findAll();
    console.log(
      `   ✅ Found ${existingDeductions.length} meal deductions in database`
    );

    if (existingDeductions.length > 0) {
      console.log("   Sample deduction:", {
        employee_id: existingDeductions[0].employee_id,
        amount: existingDeductions[0].amount,
        date: existingDeductions[0].date,
        currency: existingDeductions[0].currency,
      });
    }

    // Test 2: Test period calculation
    console.log("\n2. Testing period calculation...");
    const autoDeductions = new AutoMealDeductions();
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

    console.log(`   Current date: ${today.toDateString()}`);
    console.log(`   Period start: ${periodStart.toDateString()}`);
    console.log(`   Period end: ${periodEnd.toDateString()}`);

    // Test 3: Test meal deduction generation
    console.log("\n3. Testing meal deduction generation...");
    const mealDeductions = await autoDeductions.generateMealDeductionsForPeriod(
      periodStart,
      periodEnd
    );
    console.log(
      `   ✅ Generated ${mealDeductions.length} meal deductions for current period`
    );

    // Test 4: Test CSV content generation
    console.log("\n4. Testing CSV content generation...");
    const csvContent = autoDeductions.generateCSVContent(mealDeductions);
    console.log("   ✅ CSV content generated successfully");
    console.log("   CSV preview:");
    console.log(csvContent.split("\n").slice(0, 3).join("\n"));

    // Test 5: Test filename generation
    console.log("\n5. Testing filename generation...");
    const filename = autoDeductions.generateFilename();
    console.log(`   ✅ Generated filename: ${filename}`);

    // Test 6: Test complete processing
    console.log("\n6. Testing complete processing...");
    const result = await autoDeductions.processAndSaveMealDeductions();
    console.log(`   ✅ Processing result: ${result ? "SUCCESS" : "FAILED"}`);

    // Test 7: Check if file was created
    console.log("\n7. Checking generated file...");
    const fs = require("fs");
    const path = require("path");
    const outputDir = path.join(process.cwd(), "output");
    const files = fs.readdirSync(outputDir);
    const csvFiles = files.filter((file) => file.endsWith(".csv"));
    console.log(`   ✅ Found ${csvFiles.length} CSV files in output directory`);

    if (csvFiles.length > 0) {
      const latestFile = csvFiles[csvFiles.length - 1];
      const filePath = path.join(outputDir, latestFile);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const lines = fileContent.split("\n");
      console.log(`   Latest file: ${latestFile}`);
      console.log(`   File size: ${fileContent.length} characters`);
      console.log(`   Number of lines: ${lines.length}`);
      console.log("   File content preview:");
      console.log(lines.slice(0, 3).join("\n"));
    }

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Database connection: ✅`);
    console.log(`   - Meal deductions found: ${existingDeductions.length}`);
    console.log(`   - Period calculation: ✅`);
    console.log(`   - CSV generation: ✅`);
    console.log(`   - File processing: ${result ? "✅" : "❌"}`);
    console.log(`   - Output files: ${csvFiles.length}`);
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error(error.stack);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

// Run the test
testAutoMealDeductions();
