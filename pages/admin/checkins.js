"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/AdminLayout";
import DataTable from "../../components/DataTable";
import styles from "../../styles/AdminCheckins.module.css";
import { toast, Toaster } from "react-hot-toast";

export default function CheckIns() {
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    startDate: "2025-07-10",
    endDate: "2025-07-10",
    department: "all",
  });
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchCheckIns = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.department !== "all"
          ? { department: filters.department }
          : {}),
      });

      const response = await fetch(`/api/admin/checkins?${params}`);
      if (!response.ok) throw new Error("Failed to fetch check-ins");

      const data = await response.json();
      setCheckIns(data.checkins || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load check-ins");
      setCheckIns([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, filters]);

  useEffect(() => {
    fetchCheckIns();
  }, [fetchCheckIns]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
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
            ...(filters.department !== "all"
              ? { department: filters.department }
              : {}),
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate report");
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async (format) => {
    try {
      const response = await fetch(`/api/admin/reports/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType: "daily",
          format: format,
          filters: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            ...(filters.department !== "all"
              ? { department: filters.department }
              : {}),
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to download report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `checkins-report-${filters.startDate}_to_${filters.endDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Define table columns for DataTable
  const tableColumns = [
    {
      accessorKey: "name",
      header: "Name",
      size: 200,
      cell: ({ getValue }) => getValue() || "N/A",
    },
    {
      accessorKey: "employee_id",
      header: "ID",
      size: 120,
      cell: ({ getValue }) => {
        const id = getValue();
        if (id && id.startsWith("CONTRACTOR_")) {
          return id.replace("CONTRACTOR_", "C-");
        }
        return id || "N/A";
      },
    },
    {
      accessorKey: "entityType",
      header: "Type",
      size: 100,
      cell: ({ getValue }) => getValue() || "N/A",
    },
    {
      accessorKey: "department",
      header: "Department",
      size: 150,
      cell: ({ getValue }) => getValue() || "N/A",
    },
    {
      accessorKey: "checkin_time",
      header: "Check-in Time",
      size: 180,
      cell: ({ getValue }) => {
        const time = getValue();
        return time ? new Date(time).toLocaleString() : "N/A";
      },
    },
    {
      accessorKey: "source_type",
      header: "Source Type",
      size: 120,
      cell: ({ getValue }) => getValue() || "N/A",
    },
    {
      accessorKey: "guest_count",
      header: "Guests",
      size: 80,
      cell: ({ getValue }) => getValue() || 0,
    },
  ];

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
          <div
            className={styles.headerActions}
            style={{ display: "flex", gap: 5 }}
          >
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className={styles.downloadButton}
            >
              {isGenerating ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>

        <div className={styles.filters}>
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
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
        </div>

        <DataTable
          data={checkIns}
          columns={tableColumns}
          searchable={true}
          sortable={true}
          pagination={true}
          pageSize={itemsPerPage}
          loading={loading}
          emptyMessage="No check-ins found for the selected date"
          className={styles.dataTable}
        />

        {/* Custom Pagination Controls */}
        {!loading && checkIns.length > 0 && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              entries
            </div>
            <div className={styles.paginationControls}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={styles.paginationButton}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={styles.paginationButton}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Report Table: Only show after Generate Report is clicked and reportData is set */}
        {reportData && !isGenerating && (
          <div className={styles.reportSection}>
            <div className={styles.reportHeader}>
              <h2>{reportData.title}</h2>
              <div
                className={styles.downloadButtons}
                style={{ display: "flex", gap: 5 }}
              >
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
              </div>
            </div>
            <DataTable
              data={reportData.data}
              columns={reportData.columns.map((col) => ({
                accessorKey: col,
                header: col,
                cell: ({ getValue }) => getValue() || "N/A",
              }))}
              searchable={false}
              sortable={true}
              pagination={true}
              pageSize={10}
              className={styles.dataTable}
              emptyMessage="No report data found for the selected range"
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
