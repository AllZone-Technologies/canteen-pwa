import CronScheduler from "../../../lib/serverOnly/cronScheduler";

// Global scheduler instance (server-side only)
let globalScheduler = null;

function getScheduler() {
  if (!globalScheduler) {
    globalScheduler = new CronScheduler();
  }
  return globalScheduler;
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { action } = req.body;

    try {
      const scheduler = getScheduler();

      switch (action) {
        case "start_test":
          scheduler.startTestSchedule();
          res.status(200).json({
            success: true,
            message: "Test schedule started - running every 30 minutes",
          });
          break;

        case "start_production":
          scheduler.startProductionSchedule();
          res.status(200).json({
            success: true,
            message:
              "Production schedule started - running on 20th of every month at 9:00 AM",
          });
          break;

        case "stop":
          scheduler.stopSchedule();
          res.status(200).json({
            success: true,
            message: "Schedule stopped",
          });
          break;

        case "manual":
          const result = await scheduler.triggerManualExecution();
          res.status(200).json({
            success: result,
            message: result
              ? "Manual execution completed successfully"
              : "Manual execution failed",
          });
          break;

        default:
          res.status(400).json({
            success: false,
            error:
              "Invalid action. Use: start_test, start_production, stop, or manual",
          });
      }
    } catch (error) {
      console.error("Error in auto meal deductions API:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  } else if (req.method === "GET") {
    // Return current status
    const scheduler = getScheduler();
    const status = scheduler.getStatus();

    res.status(200).json({
      success: true,
      ...status,
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
