const db = require("../../models");
const NetworkFileService = require("./networkFileService");

class AutoMealDeductions {
  constructor() {
    this.networkService = new NetworkFileService();
  }

  async generateMealDeductionsForPeriod(startDate, endDate) {
    try {
      // Format the period string to match the database format
      const formatPeriod = (startDate, endDate) => {
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

        const startDay = startDate.getDate();
        const startMonth = months[startDate.getMonth()];
        const startYear = startDate.getFullYear();

        const endDay = endDate.getDate();
        const endMonth = months[endDate.getMonth()];
        const endYear = endDate.getFullYear();

        return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
      };

      const periodString = formatPeriod(startDate, endDate);
      console.log("Searching for meal deductions for period:", periodString);

      const mealDeductions = await db.MealDeduction.findAll({
        where: {
          date: periodString,
        },
        include: [
          {
            model: db.Employee,
            as: "Employee",
            attributes: ["employee_id", "firstname", "lastname"],
            required: false, // Make it a LEFT JOIN to avoid issues if employee doesn't exist
          },
        ],
        order: [
          ["date", "ASC"],
          ["employee_id", "ASC"],
        ],
      });

      console.log(
        `Found ${mealDeductions.length} meal deductions for the specified period`
      );
      return mealDeductions;
    } catch (error) {
      console.error("Error generating meal deductions:", error);
      throw error;
    }
  }

  generateCSVContent(mealDeductions) {
    let csvContent = "Emp#,Wage type,Amount,Date,Currency\n";

    mealDeductions.forEach((deduction) => {
      // For meal deductions, we use the current date as the deduction date
      // since the date field contains the period, not a specific date
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = today.getFullYear();
      const formattedDate = `${day}.${month}.${year}`;

      // Format amount to 2 decimal places
      const formattedAmount = parseFloat(deduction.amount).toFixed(2);

      // Add row to CSV
      csvContent += `${deduction.employee_id},${deduction.wage_type},${formattedAmount},${formattedDate},${deduction.currency}\n`;
    });

    return csvContent;
  }

  generateFilename() {
    const today = new Date();
    const filename = `${String(today.getDate()).padStart(2, "0")}.${String(
      today.getMonth() + 1
    ).padStart(2, "0")}.${today.getFullYear()}.csv`;
    return filename;
  }

  async processAndSaveMealDeductions() {
    try {
      console.log("Starting automatic meal deductions processing...");

      // Calculate date range for current period
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

      console.log("Processing period:", periodStart, "to", periodEnd);

      // Generate meal deductions
      const mealDeductions = await this.generateMealDeductionsForPeriod(
        periodStart,
        periodEnd
      );

      if (mealDeductions.length === 0) {
        console.log("No meal deductions found for the current period.");
        // Create a sample file with header only for testing
        const csvContent = "Emp#,Wage type,Amount,Date,Currency\n";
        const filename = this.generateFilename();
        const saved = await this.networkService.saveFileToNetwork(
          csvContent,
          filename
        );
        if (saved) {
          console.log("Created empty meal deductions file for testing.");
          return true;
        } else {
          console.error("Failed to save empty file.");
          return false;
        }
      }

      // Generate CSV content
      const csvContent = this.generateCSVContent(mealDeductions);

      // Generate filename
      const filename = this.generateFilename();

      // Save to network location
      const saved = await this.networkService.saveFileToNetwork(
        csvContent,
        filename
      );

      if (saved) {
        console.log(
          `Successfully processed and saved ${mealDeductions.length} meal deductions to network location.`
        );
        return true;
      } else {
        console.error("Failed to save file to network location.");
        return false;
      }
    } catch (error) {
      console.error("Error in automatic meal deductions processing:", error);
      return false;
    }
  }
}

module.exports = AutoMealDeductions;
