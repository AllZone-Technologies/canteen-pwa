"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/AdminLayout";
import DataTable from "../../components/DataTable";
import styles from "../../styles/AdminCheckins.module.css";
import { toast, Toaster } from "react-hot-toast";

export default function CheckIns() {
  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Format date for display (e.g., "Aug 21, 2025")
  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: getCurrentDate(),
    endDate: getCurrentDate(),
    department: "all",
  });
  const [departments, setDepartments] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Auto-generate report when component mounts or filters change
  useEffect(() => {
    if (departments.length > 0) {
      generateReport();
    }
  }, [departments, filters.startDate, filters.endDate, filters.department]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    // Handle date validation
    if (name === "startDate") {
      // If start date is after end date, update end date to match
      if (value > filters.endDate) {
        setFilters((prev) => ({
          ...prev,
          startDate: value,
          endDate: value,
        }));
      } else {
        setFilters((prev) => ({
          ...prev,
          startDate: value,
        }));
      }
    } else if (name === "endDate") {
      // If end date is before start date, update start date to match
      if (value < filters.startDate) {
        setFilters((prev) => ({
          ...prev,
          startDate: value,
          endDate: value,
        }));
      } else {
        setFilters((prev) => ({
          ...prev,
          endDate: value,
        }));
      }
    } else {
      // Handle other filter changes normally
      setFilters((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const generateReport = async () => {
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
            search: "", // Removed searchTerm
            ...(filters.department !== "all"
              ? { department: filters.department }
              : {}),
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate report");
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async (format) => {
    if (!reportData) return;

    if (format === "pdf") {
      try {
        // Call API for PDF download with date range parameters
        const params = new URLSearchParams({
          format: "pdf",
          startDate: filters.startDate,
          endDate: filters.endDate,
        });

        const response = await fetch(`/api/admin/checkins/export?${params}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              errorData.error ||
              `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const contentType = response.headers.get("content-type");
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        if (contentType && contentType.includes("application/pdf")) {
          // Successfully generated PDF
          link.download = `checkins-report-${filters.startDate}_to_${filters.endDate}.pdf`;
          toast.success("PDF downloaded successfully!");
        } else {
          // Fallback to HTML (printable version)
          link.download = `checkins-report-${filters.startDate}_to_${filters.endDate}.html`;
          toast.success(
            "PDF generation failed, downloaded printable HTML instead. Open the file and use Print to PDF."
          );
        }

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading PDF:", error);
        toast.error(`Failed to download PDF: ${error.message}`);
      }
    } else if (format === "csv") {
      // Client-side CSV generation (existing functionality)
      const data = reportData.data;
      const headers = reportData.columns;

      const csvContent =
        "data:text/csv;charset=utf-8," +
        headers.join(",") +
        "\n" +
        data
          .map((row) => headers.map((header) => row[header]).join(","))
          .join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `checkins-report-${filters.startDate}_to_${filters.endDate}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === "xlsx") {
      // For Excel, you would typically use a library like xlsx
      // For now, we'll just download as CSV
      toast.info(
        "Excel download not implemented yet. Downloading as CSV instead."
      );
      downloadReport("csv");
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading check-ins...</div>
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
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
          },
          success: {
            duration: 3000,
            style: {
              background: "#059669",
            },
          },
          error: {
            duration: 4000,
            style: {
              background: "#dc2626",
            },
          },
        }}
      />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Check-ins</h1>
        </div>

        <div className={styles.filters}>
          <div className={styles.topRow}>
            <div className={styles.dateRangeDisplay}>
              <span className={styles.dateRangeLabel}>Date Range:</span>
              <span className={styles.dateRangeValue}>
                {formatDateForDisplay(filters.startDate)}
                {filters.startDate !== filters.endDate &&
                  ` - ${formatDateForDisplay(filters.endDate)}`}
              </span>
            </div>
            <div className={styles.generateButtonContainer}>
              <button
                onClick={generateReport}
                disabled={isGenerating}
                className={styles.downloadButton}
              >
                {isGenerating ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="startDate">Start Date:</label>
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
            <label htmlFor="endDate">End Date:</label>
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
            <label htmlFor="department">Department:</label>
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
        </div>

        {/* Report Section: Show by default with current date data */}
        <div className={styles.reportSection}>
          <div className={styles.reportHeader}>
            <h2>Check-ins Report</h2>
            <div className={styles.reportControls}>
              <div className={styles.downloadButtons}>
                <button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className={styles.generateButton}
                >
                  {isGenerating ? "Generating..." : "Refresh Report"}
                </button>
                {reportData && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingMessage}>Loading check-ins...</div>
          ) : reportData ? (
            <DataTable
              data={reportData.data}
              columns={reportData.columns.map((col) => ({
                accessorKey: col,
                header: col,
                cell: ({ getValue }) => getValue() || "N/A",
              }))}
              searchable={true}
              sortable={true}
              pagination={true}
              pageSize={10}
              className={styles.dataTable}
              emptyMessage="No check-ins found for the selected date range"
            />
          ) : (
            <div className={styles.noDataMessage}>
              Click "Refresh Report" to generate check-ins data for the selected
              date range
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
