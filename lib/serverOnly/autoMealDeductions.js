const db = require("../../models");
const NetworkFileService = require("./networkFileService");

class AutoMealDeductions {
  constructor() {
    this.networkService = new NetworkFileService();
  }

  async generateMealDeductionsForPeriod(startDate, endDate) {
    try {
      // Convert dates to YYYY-MM-DD format for database query
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      // Get meal deductions for the date range
      console.log(
        "Searching for meal deductions from",
        formatDate(startDate),
        "to",
        formatDate(endDate)
      );

      const mealDeductions = await db.MealDeduction.findAll({
        where: {
          date: {
            [db.Sequelize.Op.between]: [
              formatDate(startDate),
              formatDate(endDate),
            ],
          },
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
        `Found ${mealDeductions.length} meal deductions for the specified date range`
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
      // Convert YYYY-MM-DD to DD.MM.YYYY format for CSV
      const dateParts = deduction.date.split("-");
      const year = dateParts[0];
      const month = dateParts[1];
      const day = dateParts[2];
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

      // Test network connection
      const networkConnected =
        await this.networkService.testNetworkConnection();
      if (!networkConnected) {
        console.error("Network connection failed. Cannot save file.");
        return false;
      }

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
        }
        return false;
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
