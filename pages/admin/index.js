import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import styles from "../../styles/AdminDashboard.module.css";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCheckIns: 0,
    todayCheckIns: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      const data = await response.json();

      if (response.ok) {
        setStats(data);
      } else {
        setError(data.message || "Failed to fetch dashboard stats");
      }
    } catch (error) {
      setError("An error occurred while fetching dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <h1>Dashboard</h1>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>Loading dashboard stats...</div>
        ) : (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Total Users</h3>
              <p className={styles.statValue}>{stats.totalUsers}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Total Check-ins</h3>
              <p className={styles.statValue}>{stats.totalCheckIns}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Today&apos;s Check-ins</h3>
              <p className={styles.statValue}>{stats.todayCheckIns}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Active Users</h3>
              <p className={styles.statValue}>{stats.activeUsers}</p>
            </div>
          </div>
        )}

        <div className={styles.quickActions}>
          <h2>Quick Actions</h2>
          <div className={styles.actionButtons}>
            <Link href="/admin/users" className={styles.actionButton}>
              Add New User
            </Link>
            <Link href="/admin/bulk-upload" className={styles.actionButton}>
              Bulk Upload Users
            </Link>
            <Link href="/admin/reports" className={styles.actionButton}>
              View Reports
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
