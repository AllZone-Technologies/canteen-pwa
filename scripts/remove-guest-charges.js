const db = require("../models");

async function removeGuestCharges() {
  try {
    console.log("=== Removing Guest Charges from Meal Deductions ===");
    console.log(
      "New rule: Only employees are charged 5 QAR per visit, guests are free"
    );

    // Get all meal deductions
    const mealDeductions = await db.MealDeduction.findAll();

    console.log(
      `Found ${mealDeductions.length} meal deduction records to update`
    );

    let updatedCount = 0;
    let totalSavings = 0;

    for (const deduction of mealDeductions) {
      console.log(`\n=== Processing Employee ${deduction.employee_id} ===`);
      console.log(`Period: ${deduction.date}`);
      console.log(`Current amount: ${deduction.amount} QAR`);
      console.log(`Current visit count: ${deduction.visit_count}`);

      // Parse the deduction period to get start and end dates
      const periodMatch = deduction.date.match(
        /(\d{1,2})\s+(\w+)\s+(\d{4})\s+-\s+(\d{1,2})\s+(\w+)\s+(\d{4})/
      );

      if (!periodMatch) {
        console.log("Could not parse deduction period, skipping...");
        continue;
      }

      const months = [
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

      // Calculate new amount based on new rule: only 5 QAR per visit, no guest charges
      let newAmount = 0;
      let totalGuests = 0;

      visitLogs.forEach((visit, index) => {
        const visitAmount = 5; // 5 QAR per visit only
        newAmount += visitAmount;
        totalGuests += visit.guest_count;

        console.log(
          "Visit " +
            (index + 1) +
            ": " +
            visit.checkin_time.toDateString() +
            " - Guests: " +
            visit.guest_count +
            " - Amount: " +
            visitAmount +
            " QAR (guests are free)"
        );
      });

      const oldAmount = parseFloat(deduction.amount);
      const savings = oldAmount - newAmount;

      console.log(`\nOld amount: ${oldAmount} QAR`);
      console.log(`New amount: ${newAmount} QAR`);
      console.log(`Total guests in period: ${totalGuests}`);
      console.log(`Savings: ${savings} QAR`);

      // Update the deduction
      if (oldAmount !== newAmount) {
        console.log("Amount mismatch - Updating to remove guest charges...");

        await deduction.update({
          amount: newAmount,
          visit_count: visitLogs.length,
        });

        updatedCount++;
        totalSavings += savings;
        console.log("Updated successfully");
      } else {
        console.log("Amount is already correct (no guest charges)");
      }
    }

    console.log("\n=== Summary ===");
    console.log(`Total records processed: ${mealDeductions.length}`);
    console.log(`Records updated: ${updatedCount}`);
    console.log(`Total savings: ${totalSavings} QAR`);
    console.log(
      "All meal deductions now follow the new rule: employees only pay 5 QAR per visit, guests are free"
    );
  } catch (error) {
    console.error("Error: " + error);
  } finally {
    await db.sequelize.close();
  }
}

removeGuestCharges();
