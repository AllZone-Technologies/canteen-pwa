const db = require("../models");

async function testMealFix() {
  try {
    console.log("=== Testing Meal Deduction Fix ===");

    // Test with employee "1" who should have 4 visits
    const employeeId = "1";
    const deductionPeriod = "21 July 2025 - 20 August 2025";

    console.log(`\nTesting employee ${employeeId}`);

    // Get current meal deduction
    const mealDeduction = await db.MealDeduction.findOne({
      where: {
        employee_id: employeeId,
        date: deductionPeriod,
      },
    });

    if (mealDeduction) {
      console.log("Current meal deduction:");
      console.log("- Amount: " + mealDeduction.amount);
      console.log("- Visit count: " + mealDeduction.visit_count);
    }

    // Get all visit logs
    const visitLogs = await db.VisitLog.findAll({
      where: {
        employee_id: employeeId,
        checkin_time: {
          [db.Sequelize.Op.gte]: new Date("2025-07-21"),
          [db.Sequelize.Op.lte]: new Date("2025-08-20"),
        },
      },
      order: [["checkin_time", "ASC"]],
    });

    console.log(`\nFound ${visitLogs.length} visit logs:`);

    let totalAmount = 0;
    visitLogs.forEach((visit, index) => {
      const visitAmount = 5;
      const guestAmount = visit.guest_count * 5;
      const totalVisitAmount = visitAmount + guestAmount;
      totalAmount += totalVisitAmount;

      console.log(
        `Visit ${index + 1}: ${visit.checkin_time.toDateString()} - Guests: ${
          visit.guest_count
        } - Amount: ${totalVisitAmount} QAR`
      );
    });

    console.log(
      `\nExpected total: ${totalAmount} QAR (${visitLogs.length} visits)`
    );

    if (mealDeduction && parseFloat(mealDeduction.amount) !== totalAmount) {
      console.log("❌ Amount mismatch - fixing...");

      await mealDeduction.update({
        amount: totalAmount,
        visit_count: visitLogs.length,
      });

      console.log("✅ Fixed successfully");
    } else {
      console.log("✅ Amount is correct");
    }
  } catch (error) {
    console.error("Error: " + error);
  } finally {
    await db.sequelize.close();
  }
}

testMealFix();
