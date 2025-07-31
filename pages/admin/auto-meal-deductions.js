import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import styles from "../../styles/AdminAutoMealDeductions.module.css";

export default function AutoMealDeductions() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState({
    isRunning: false,
    hasActiveSchedule: false,
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/admin/auto-meal-deductions");
      const data = await response.json();
      if (response.ok) {
        setStatus(data);
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  const handleAction = async (action) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/auto-meal-deductions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        await fetchStatus(); // Refresh status
      } else {
        setMessage(data.error || "Action failed");
      }
    } catch (error) {
      setMessage("Error performing action");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <h1>Automatic Meal Deductions</h1>

        <div className={styles.description}>
          <p>
            Configure automatic meal deductions file generation and saving to
            the network folder.
          </p>
          <p>
            <strong>Windows Server:</strong> Files saved to
            \\192.168.1.155\Canteen_Report
          </p>
          <p>
            <strong>Mac/Linux (Testing):</strong> Files saved to local output/
            folder
          </p>
          <p>
            <strong>File Format:</strong> CSV with employee meal deductions
          </p>
        </div>

        <div className={styles.status}>
          <h3>Current Status</h3>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span className={styles.label}>Task Running:</span>
              <span
                className={`${styles.value} ${
                  status.isRunning ? styles.running : styles.stopped
                }`}
              >
                {status.isRunning ? "Yes" : "No"}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.label}>Active Schedule:</span>
              <span
                className={`${styles.value} ${
                  status.hasActiveSchedule ? styles.active : styles.inactive
                }`}
              >
                {status.hasActiveSchedule ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.controls}>
          <h3>Schedule Controls</h3>

          <div className={styles.buttonGroup}>
            <button
              onClick={() => handleAction("start_test")}
              disabled={loading}
              className={styles.testBtn}
            >
              {loading ? "Starting..." : "Start Test Schedule (30 min)"}
            </button>

            <button
              onClick={() => handleAction("start_production")}
              disabled={loading}
              className={styles.productionBtn}
            >
              {loading ? "Starting..." : "Start Production Schedule (Monthly)"}
            </button>

            <button
              onClick={() => handleAction("stop")}
              disabled={loading}
              className={styles.stopBtn}
            >
              {loading ? "Stopping..." : "Stop Schedule"}
            </button>
          </div>

          <div className={styles.manualSection}>
            <h4>Manual Execution</h4>
            <button
              onClick={() => handleAction("manual")}
              disabled={loading}
              className={styles.manualBtn}
            >
              {loading ? "Processing..." : "Generate & Save Now"}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`${styles.message} ${
              message.includes("Error") ? styles.error : styles.success
            }`}
          >
            {message}
          </div>
        )}

        <div className={styles.info}>
          <h3>Schedule Information</h3>
          <ul>
            <li>
              <strong>Test Schedule:</strong> Runs every 30 minutes for testing
              purposes
            </li>
            <li>
              <strong>Production Schedule:</strong> Runs on the 20th of every
              month at 9:00 AM
            </li>
            <li>
              <strong>Windows Server:</strong> Files saved to
              \\192.168.1.155\Canteen_Report
            </li>
            <li>
              <strong>Mac/Linux Testing:</strong> Files saved to local output/
              folder
            </li>
            <li>
              <strong>File Format:</strong> CSV with employee meal deductions
            </li>
            <li>
              <strong>Timezone:</strong> Asia/Qatar (adjust as needed)
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
