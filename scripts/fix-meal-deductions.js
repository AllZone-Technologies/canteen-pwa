const db = require("../models");

async function fixMealDeductions() {
  try {
    console.log("=== Fixing Meal Deduction Records ===");
    
    // Get all meal deductions
    const mealDeductions = await db.MealDeduction.findAll();
    
    console.log(`Found ${mealDeductions.length} meal deduction records to fix`);
    
    for (const deduction of mealDeductions) {
      console.log(`\n=== Processing Employee ${deduction.employee_id} ===");
      console.log(`Period: ${deduction.date}`);
      console.log(`Current amount: ${deduction.amount}`);
      console.log(`Current visit count: ${deduction.visit_count}`);
      
      // Parse the deduction period to get start and end dates
      const periodMatch = deduction.date.match(/(\d{1,2})\s+(\w+)\s+(\d{4})\s+-\s+(\d{1,2})\s+(\w+)\s+(\d{4})/);
      
      if (!periodMatch) {
        console.log("❌ Could not parse deduction period, skipping...");
        continue;
      }
      
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      
      const startDay = parseInt(periodMatch[1]);
      const startMonth = months.indexOf(periodMatch[2]);
      const startYear = parseInt(periodMatch[3]);
      const endDay = parseInt(periodMatch[4]);
      const endMonth = months.indexOf(periodMatch[5]);
      const endYear = parseInt(periodMatch[6]);
      
      const deductionPeriodStart = new Date(startYear, startMonth, startDay);
      const deductionPeriodEnd = new Date(endYear, endMonth, endDay);
      
      // Get all visit logs for this employee in the period
      const visitLogs = await db.VisitLog.findAll({
        where: {
          employee_id: deduction.employee_id,
          checkin_time: {
            [db.Sequelize.Op.gte]: deductionPeriodStart,
            [db.Sequelize.Op.lte]: deductionPeriodEnd,
          },
        },
        order: [["checkin_time", "ASC"]],
      });
      
      console.log(`Found ${visitLogs.length} visit logs for this period`);
      
      // Calculate correct amount based on visit logs
      let correctAmount = 0;
      let correctVisitCount = 0;
      
      visitLogs.forEach((visit, index) => {
        const visitAmount = 5; // 5 QAR per visit only
        const totalVisitAmount = visitAmount; // No guest charges
        
        correctAmount += totalVisitAmount;
        correctVisitCount++;
        
        console.log(`Visit ${index + 1}: ${visit.checkin_time.toDateString()} - Guests: ${visit.guest_count} - Amount: ${visitAmount} QAR (guests are free)`);
      });
      
      console.log(`\nCalculated total: ${correctAmount} QAR (${correctVisitCount} visits)`);
      console.log(`Current in DB: ${deduction.amount} QAR (${deduction.visit_count} visits)`);
      
      // Update if there's a mismatch
      if (parseFloat(deduction.amount) !== correctAmount || deduction.visit_count !== correctVisitCount) {
        console.log("❌ MISMATCH DETECTED - Updating...");
        
        await deduction.update({
          amount: correctAmount,
          visit_count: correctVisitCount,
        });
        
        console.log("✅ Updated successfully");
      } else {
        console.log("✅ Amount and visit count are correct");
      }
    }
    
    console.log("\n=== Final Verification ===");
    const updatedDeductions = await db.MealDeduction.findAll();
    
    updatedDeductions.forEach(deduction => {
      console.log(`Employee ${deduction.employee_id}: ${deduction.amount} QAR (${deduction.visit_count} visits)`);
    });
    
  } catch (error) {
    console.error("Error: " + error);
  } finally {
    await db.sequelize.close();
  }
}

fixMealDeductions(); 