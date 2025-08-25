"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import styles from "../../styles/AdminReports.module.css";
import { toast } from "react-hot-toast";
import { useLoading } from "../../context/loading-context";
import "react-datepicker/dist/react-datepicker.css";

export default function Reports() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    reportType: "daily",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    department: "all",
    entityType: "all",
  });
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/admin/departments");
      if (!response.ok) throw new Error("Failed to fetch departments");
      const data = await response.json();
      setDepartments(data);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  console.log("departments", departments);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setFilters((prev) => ({
      ...prev,
      startDate: start,
      endDate: end,
    }));
  };

  const handleReportTypeChange = (e) => {
    // Only daily report is supported, so do nothing
    setReportData(null);
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType: "daily",
          filters: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            department:
              filters.department === "all" ? null : filters.department,
            entityType: filters.entityType,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message ||
            error.error ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      setReportData(data);
      toast.success("Report generated successfully");
    } catch (err) {
      toast.error(err.message);
      setReportData(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async (format) => {
    if (!reportData) {
      toast.error("Please generate a report first");
      return;
    }

    try {
      const response = await fetch("/api/admin/reports/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType: "daily",
          filters: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            department:
              filters.department === "all" ? null : filters.department,
            entityType: filters.entityType,
          },
          format,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to download report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/pdf")) {
        // Successfully generated PDF
        link.download = `report-${filters.reportType}-${filters.startDate}.pdf`;
        toast.success(`Report downloaded in PDF format`);
      } else if (contentType && contentType.includes("text/html")) {
        // Fallback to HTML (printable version)
        link.download = `report-${filters.reportType}-${filters.startDate}.html`;
        toast.success(
          `Report downloaded in HTML format. Open the file and use Print to PDF.`
        );
      } else {
        // Other formats (CSV, Excel)
        link.download = `report-${filters.reportType}-${filters.startDate}.${format}`;
        toast.success(`Report downloaded in ${format.toUpperCase()} format`);
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading departments...</div>
      </AdminLayout>
    );

  if (error)
    return (
      <AdminLayout>
        <div className={styles.error}>{error}</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Reports</h1>
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="department">Department</label>
              <select
                id="department"
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                className={styles.filterSelect}
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="entityType">Entity Type</label>
              <select
                id="entityType"
                name="entityType"
                value={filters.entityType}
                onChange={handleFilterChange}
                className={styles.filterSelect}
              >
                <option value="all">All</option>
                <option value="employee">Employees</option>
                <option value="contractor">Contractors</option>
              </select>
            </div>
            <button
              onClick={handleGenerateReport}
              className={styles.generateButton}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>
        {/* Summary Section */}
        {reportData && reportData.summary && (
          <div className={styles.summaryBox}>
            <strong>Summary:</strong>
            <div>Total Guests: {reportData.summary.totalGuests}</div>
            <div>Employee Check-ins: {reportData.summary.employeeCheckins}</div>
            <div>
              Contractor Check-ins: {reportData.summary.contractorCheckins}
            </div>
          </div>
        )}

        {isGenerating ? (
          <div className={styles.loading}>Generating report...</div>
        ) : reportData ? (
          <div className={styles.reportSection}>
            <div className={styles.reportHeader}>
              <h2>{reportData.title}</h2>
              <div className={styles.downloadButtons}>
                <button
                  onClick={() => downloadReport("csv")}
                  className={styles.downloadButton}
                >
                  Download CSV
                </button>
                <button
                  onClick={() => downloadReport("xlsx")}
                  className={styles.downloadButton}
                >
                  Download Excel
                </button>
                <button
                  onClick={() => downloadReport("pdf")}
                  className={styles.downloadButton}
                  title="Download as PDF (or printable HTML if PDF generation fails)"
                >
                  Download PDF
                </button>
              </div>
            </div>

            <div className={styles.reportTable}>
              <table>
                <thead>
                  <tr>
                    {reportData.columns.map((column, index) => (
                      <th key={index}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.data.map((row, index) => (
                    <tr key={index}>
                      {reportData.columns.map((column, colIndex) => (
                        <td key={colIndex}>{row[column]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reportData.summary && (
              <div className={styles.reportSummary}>
                <h3>Summary</h3>
                <div className={styles.summaryGrid}>
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <div key={key} className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className={styles.summaryValue}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
