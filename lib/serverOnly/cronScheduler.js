const cron = require("node-cron");
const AutoMealDeductions = require("./autoMealDeductions");

class CronScheduler {
  constructor() {
    this.autoMealDeductions = new AutoMealDeductions();
    this.isRunning = false;
    this.currentTask = null;
  }

  // For testing: run every 30 minutes
  startTestSchedule() {
    console.log("Starting test schedule - running every 30 minutes");

    if (this.currentTask) {
      this.currentTask.stop();
    }

    this.currentTask = cron.schedule(
      "*/30 * * * *",
      async () => {
        if (this.isRunning) {
          console.log("Previous task still running, skipping...");
          return;
        }

        this.isRunning = true;
        console.log("Running automatic meal deductions task...");

        try {
          await this.autoMealDeductions.processAndSaveMealDeductions();
        } catch (error) {
          console.error("Error in scheduled task:", error);
        } finally {
          this.isRunning = false;
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Qatar", // Adjust timezone as needed
      }
    );

    return this.currentTask;
  }

  // For production: run on 20th of every month at 9:00 AM
  startProductionSchedule() {
    console.log(
      "Starting production schedule - running on 20th of every month at 9:00 AM"
    );

    if (this.currentTask) {
      this.currentTask.stop();
    }

    this.currentTask = cron.schedule(
      "0 9 20 * *",
      async () => {
        if (this.isRunning) {
          console.log("Previous task still running, skipping...");
          return;
        }

        this.isRunning = true;
        console.log(
          "Running automatic meal deductions task for monthly report..."
        );

        try {
          await this.autoMealDeductions.processAndSaveMealDeductions();
        } catch (error) {
          console.error("Error in scheduled task:", error);
        } finally {
          this.isRunning = false;
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Qatar", // Adjust timezone as needed
      }
    );

    return this.currentTask;
  }

  // Manual trigger for immediate execution
  async triggerManualExecution() {
    if (this.isRunning) {
      console.log("Task already running, please wait...");
      return false;
    }

    this.isRunning = true;
    console.log("Manually triggering meal deductions processing...");

    try {
      const result =
        await this.autoMealDeductions.processAndSaveMealDeductions();
      return result;
    } catch (error) {
      console.error("Error in manual execution:", error);
      return false;
    } finally {
      this.isRunning = false;
    }
  }

  stopSchedule() {
    if (this.currentTask) {
      this.currentTask.stop();
      this.currentTask = null;
      console.log("Cron schedule stopped");
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      hasActiveSchedule: this.currentTask !== null,
    };
  }
}

module.exports = CronScheduler;
