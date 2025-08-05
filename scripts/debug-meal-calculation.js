const db = require("../models");

async function debugMealCalculation() {
  try {
    console.log("=== Debugging Meal Deduction Calculation ===");
    
    // Test with employee "1" who has 4 visits but only 5.02 QAR
    const employeeId = "1";
    const deductionPeriod = "21 July 2025 - 20 August 2025";
    
    console.log(`\n=== Analyzing Employee ${employeeId} ===");
    
    // Get the meal deduction record
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
      console.log("- Data type of amount: " + typeof mealDeduction.amount);
    }
    
    // Get all visit logs for this employee in the period
    const visitLogs = await db.VisitLog.findAll({
      where: {
        employee_id: employeeId,
        checkin_time: {
          [db.Sequelize.Op.gte]: new Date('2025-07-21'),
          [db.Sequelize.Op.lte]: new Date('2025-08-20')
        }
      },
      order: [["checkin_time", "ASC"]]
    });
    
    console.log(`\nFound ${visitLogs.length} visit logs for employee ${employeeId}:`);
    
    let calculatedTotal = 0;
    visitLogs.forEach((visit, index) => {
      const visitAmount = 5; // 5 QAR per visit
      const guestAmount = visit.guest_count * 5; // 5 QAR per guest
      const totalVisitAmount = visitAmount + guestAmount;
      calculatedTotal += totalVisitAmount;
      
      console.log(`Visit ${index + 1}: ${visit.checkin_time.toDateString()} - Guests: ${visit.guest_count} - Amount: ${visitAmount} + ${guestAmount} = ${totalVisitAmount} QAR`);
    });
    
    console.log(`\nCalculated total: ${calculatedTotal} QAR`);
    console.log(`Current amount in DB: ${mealDeduction ? mealDeduction.amount : 'N/A'}`);
    
    if (mealDeduction && parseFloat(mealDeduction.amount) !== calculatedTotal) {
      console.log(`\n❌ MISMATCH: Expected ${calculatedTotal} QAR, but got ${mealDeduction.amount} QAR`);
      
      // Test the update logic
      console.log("\n=== Testing Update Logic ===");
      const newAmount = calculatedTotal;
      const newVisitCount = visitLogs.length;
      
      console.log(`Updating to: ${newAmount} QAR (${newVisitCount} visits)`);
      
      await mealDeduction.update({
        amount: newAmount,
        visit_count: newVisitCount,
      });
      
      console.log("✅ Update completed");
      
      // Verify the update
      const updatedDeduction = await db.MealDeduction.findOne({
        where: {
          employee_id: employeeId,
          date: deductionPeriod,
        },
      });
      
      console.log(`\nAfter update:`);
      console.log("- Amount: " + updatedDeduction.amount);
      console.log("- Visit count: " + updatedDeduction.visit_count);
      
    } else if (mealDeduction) {
      console.log("✅ Amount matches expected calculation");
    }
    
    // Test with another employee
    console.log(`\n=== Analyzing Employee 2 ===");
    const employee2Id = "2";
    
    const mealDeduction2 = await db.MealDeduction.findOne({
      where: {
        employee_id: employee2Id,
        date: deductionPeriod,
      },
    });
    
    const visitLogs2 = await db.VisitLog.findAll({
      where: {
        employee_id: employee2Id,
        checkin_time: {
          [db.Sequelize.Op.gte]: new Date('2025-07-21'),
          [db.Sequelize.Op.lte]: new Date('2025-08-20')
        }
      },
      order: [["checkin_time", "ASC"]]
    });
    
    console.log(`Found ${visitLogs2.length} visit logs for employee ${employee2Id}:`);
    
    let calculatedTotal2 = 0;
    visitLogs2.forEach((visit, index) => {
      const visitAmount = 5;
      const guestAmount = visit.guest_count * 5;
      const totalVisitAmount = visitAmount + guestAmount;
      calculatedTotal2 += totalVisitAmount;
      
      console.log(`Visit ${index + 1}: ${visit.checkin_time.toDateString()} - Guests: ${visit.guest_count} - Amount: ${visitAmount} + ${guestAmount} = ${totalVisitAmount} QAR`);
    });
    
    console.log(`\nCalculated total: ${calculatedTotal2} QAR`);
    console.log(`Current amount in DB: ${mealDeduction2 ? mealDeduction2.amount : 'N/A'}`);
    
    if (mealDeduction2 && parseFloat(mealDeduction2.amount) !== calculatedTotal2) {
      console.log(`\n❌ MISMATCH: Expected ${calculatedTotal2} QAR, but got ${mealDeduction2.amount} QAR`);
      
      await mealDeduction2.update({
        amount: calculatedTotal2,
        visit_count: visitLogs2.length,
      });
      
      console.log("✅ Update completed for employee 2");
    }
    
  } catch (error) {
    console.error("Error: " + error);
  } finally {
    await db.sequelize.close();
  }
}

debugMealCalculation(); 