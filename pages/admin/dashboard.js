"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";

import styles from "../../styles/AdminDashboard.module.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from "chart.js";
import { Line, Bar, Doughnut, PolarArea, HorizontalBar } from "react-chartjs-2";
import { toast } from "react-hot-toast";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalCheckins: 0,
    totalGuests: 0,
    todayCheckins: 0,
    todayGuests: 0,
    contractorsCheckins: 0,
    employeesCheckins: 0,
  });
  const [chartData, setChartData] = useState({
    checkinTrend: {
      labels: [],
      data: [],
    },
    departmentDistribution: {
      labels: [],
      data: [],
    },

    sourceTypeDistribution: {
      labels: [],
      data: [],
    },
    hourlyCheckins: {
      labels: [],
      data: [],
    },
    contractorsVsEmployees: {
      labels: [],
      data: [],
    },
    guestTrend: {
      labels: [],
      data: [],
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const data = await response.json();
      setStats(data.stats);
      setChartData(data.charts);
    } catch (error) {
      setError(error.message);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const checkinTrendData = {
    labels: chartData.checkinTrend.labels,
    datasets: [
      {
        label: "Check-ins",
        data: chartData.checkinTrend.data,
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const departmentDistributionData = {
    labels: chartData.departmentDistribution.labels,
    datasets: [
      {
        label: "Employees by Department",
        data: chartData.departmentDistribution.data,
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const sourceTypeData = {
    labels: chartData.sourceTypeDistribution.labels,
    datasets: [
      {
        label: "Check-ins by Source Type",
        data: chartData?.sourceTypeDistribution?.data,
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(153, 102, 255, 1)"],
        borderWidth: 1,
      },
    ],
  };

  // Daily check-ins with time analysis (busiest times)
  const hourlyCheckinsData = {
    labels: chartData.hourlyCheckins.labels,
    datasets: [
      {
        label: "Check-ins by Hour",
        data: chartData.hourlyCheckins.data,
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Contractors vs Employees check-ins
  const contractorsVsEmployeesData = {
    labels: chartData.contractorsVsEmployees.labels,
    datasets: [
      {
        label: "Today's Check-ins",
        data: chartData.contractorsVsEmployees.data,
        backgroundColor: ["rgba(54, 162, 235, 0.8)", "rgba(255, 159, 64, 0.8)"],
        borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 159, 64, 1)"],
        borderWidth: 2,
        hoverBackgroundColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(255, 159, 64, 1)",
        ],
      },
    ],
  };

  // Guest count trend
  const getWeekLabelsAndData = (data) => {
    // Get today and the last 6 days
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        date: d,
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        iso: d.toISOString().slice(0, 10),
      });
    }
    // Map data to ISO date if possible, else just use order
    let mapped = days.map((d, idx) => ({
      ...d,
      value: Array.isArray(data) && data.length === 7 ? data[idx] : 0,
    }));
    // Sort so Monday is first, Sunday is last
    const weekOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    mapped.sort(
      (a, b) => weekOrder.indexOf(a.label) - weekOrder.indexOf(b.label)
    );
    return {
      labels: mapped.map((d) => d.label),
      data: mapped.map((d) => d.value),
    };
  };

  const guestWeek = getWeekLabelsAndData(chartData.guestTrend.data);
  const guestTrendData = {
    labels: guestWeek.labels,
    datasets: [
      {
        label: "Guest Count",
        data: guestWeek.data,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.loading}>Loading dashboard data...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.error}>Error: {error}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.dashboard}>
        <h1>Dashboard</h1>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total Employees</h3>
            <p className={styles.statNumber}>{stats.totalEmployees}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Total Check-ins</h3>
            <p className={styles.statNumber}>{stats.totalCheckins}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Total Guests</h3>
            <p className={styles.statNumber}>{stats.totalGuests}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Employee Check-ins</h3>
            <p className={styles.statNumber}>{stats.employeesCheckins}</p>
            <p className={styles.statSubtitle}>(Today)</p>
          </div>
          <div className={styles.statCard}>
            <h3>Contractor Check-ins</h3>
            <p className={styles.statNumber}>{stats.contractorsCheckins}</p>
            <p className={styles.statSubtitle}>(Today)</p>
          </div>
          <div className={styles.statCard}>
            <h3>Today&apos;s Guests</h3>
            <p className={styles.statNumber}>{stats.todayGuests}</p>
          </div>
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3>Daily Check-ins by Hour (Busiest Times)</h3>
            <div className={styles.chartContainer}>
              <Bar
                data={hourlyCheckinsData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: "top",
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                    },
                  },
                  scales: {
                    x: {
                      display: true,
                      title: {
                        display: true,
                        text: "Hour of Day",
                      },
                      ticks: {
                        callback: function (value) {
                          return Number.isInteger(this.getLabelForValue(value))
                            ? this.getLabelForValue(value)
                            : "";
                        },
                      },
                    },
                    y: {
                      display: true,
                      title: {
                        display: true,
                        text: "Number of Check-ins",
                      },
                      beginAtZero: true,
                      min: 0,
                      suggestedMax: 10,
                      ticks: {
                        callback: function (value) {
                          return Number.isInteger(value) ? value : "";
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3>Employees vs Contractors Check-ins</h3>
            <div className={styles.chartContainer}>
              <Bar
                data={contractorsVsEmployeesData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: "top",
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                    },
                  },
                  scales: {
                    x: {
                      display: true,
                      title: {
                        display: true,
                        text: "User Type",
                      },
                      ticks: {
                        callback: function (value) {
                          return Number.isInteger(this.getLabelForValue(value))
                            ? this.getLabelForValue(value)
                            : "";
                        },
                      },
                    },
                    y: {
                      display: true,
                      title: {
                        display: true,
                        text: "Number of Check-ins",
                      },
                      beginAtZero: true,
                      min: 0,
                      suggestedMax: 10,
                      ticks: {
                        callback: function (value) {
                          return Number.isInteger(value) ? value : "";
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3>Guest Count Trend (Last 7 Days)</h3>
            <div className={styles.chartContainer}>
              <Bar
                data={guestTrendData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: "top",
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                    },
                  },
                  scales: {
                    x: {
                      type: "category",
                      display: true,
                      title: {
                        display: true,
                        text: "Day of Week",
                      },
                    },
                    y: {
                      display: true,
                      title: {
                        display: true,
                        text: "Number of Guests",
                      },
                      beginAtZero: true,
                      min: 0,
                      suggestedMax: 10,
                      ticks: {
                        callback: function (value) {
                          return Number.isInteger(value) ? value : "";
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3>Department Distribution</h3>
            <div className={styles.chartContainer}>
              <Doughnut
                data={departmentDistributionData}
                options={{ maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3>Check-ins by Source Type</h3>
            <div className={styles.chartContainer}>
              <Bar
                data={sourceTypeData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: "top",
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                    },
                  },
                  scales: {
                    x: {
                      display: true,
                      title: {
                        display: true,
                        text: "Source Type",
                      },
                      ticks: {
                        callback: function (value) {
                          return Number.isInteger(this.getLabelForValue(value))
                            ? this.getLabelForValue(value)
                            : "";
                        },
                      },
                    },
                    y: {
                      display: true,
                      title: {
                        display: true,
                        text: "Number of Check-ins",
                      },
                      beginAtZero: true,
                      min: 0,
                      suggestedMax: 10,
                      ticks: {
                        callback: function (value) {
                          return Number.isInteger(value) ? value : "";
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
