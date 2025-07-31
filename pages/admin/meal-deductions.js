import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import styles from "../../styles/AdminMealDeductions.module.css";

export default function MealDeductions() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [deductions, setDeductions] = useState([]);

  const generateDeductions = async () => {
    if (!startDate || !endDate) {
      setMessage("Please select both start and end dates");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/meal-deductions?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();

      if (response.ok) {
        setDeductions(data.data);
        setMessage(data.message);
      } else {
        setMessage(data.error || "Failed to generate deductions");
      }
    } catch (error) {
      setMessage("Error generating deductions");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    if (!startDate || !endDate) {
      setMessage("Please select both start and end dates");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/meal-deductions/download?startDate=${startDate}&endDate=${endDate}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          response.headers
            .get("content-disposition")
            ?.split("filename=")[1]
            ?.replace(/"/g, "") || "meal-deductions.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setMessage("CSV file downloaded successfully");
      } else {
        const data = await response.json();
        setMessage(data.error || "Failed to download CSV");
      }
    } catch (error) {
      setMessage("Error downloading CSV");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (periodString) => {
    // periodString is already in "21 January 2024 - 20 February 2024" format
    return periodString;
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <h1>Meal Deductions</h1>

        <div className={styles.description}>
          <p>
            Generate meal deductions for employee check-ins. Each visit costs 5
            QAR.
          </p>
          <p>Only employee visits are included (contractors are excluded).</p>
          <p>
            <strong>Note:</strong> Deductions are aggregated by period (21st to
            20th of next month).
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.dateInputs}>
            <div className={styles.dateGroup}>
              <label htmlFor="startDate">Start Date:</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>

            <div className={styles.dateGroup}>
              <label htmlFor="endDate">End Date:</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
          </div>

          <div className={styles.buttons}>
            <button
              onClick={generateDeductions}
              disabled={loading || !startDate || !endDate}
              className={styles.generateBtn}
            >
              {loading ? "Generating..." : "Generate Deductions"}
            </button>

            <button
              onClick={downloadCSV}
              disabled={loading || !startDate || !endDate}
              className={styles.downloadBtn}
            >
              {loading ? "Downloading..." : "Download CSV"}
            </button>
          </div>
        </div>

        {message && <div className={styles.message}>{message}</div>}

        {deductions.length > 0 && (
          <div className={styles.results}>
            <h2>Generated Deductions ({deductions.length})</h2>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Wage Type</th>
                    <th>Amount (QAR)</th>
                    <th>Date</th>
                    <th>Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {deductions.map((deduction, index) => (
                    <tr key={index}>
                      <td>{deduction.employee_id}</td>
                      <td>{deduction.wage_type}</td>
                      <td>{parseFloat(deduction.amount).toFixed(2)}</td>
                      <td>{formatDate(deduction.date)}</td>
                      <td>{deduction.visit_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
