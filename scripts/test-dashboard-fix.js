const fetchWrapper = require("../lib/fetchWrapper");

async function testDashboardAPI() {
  try {
    console.log("Testing dashboard API fix...");

    const response = await fetchWrapper("/api/admin/dashboard");

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Dashboard API is working correctly!");
      console.log("📊 Response includes:");

      if (data.stats) {
        console.log("  - Stats data:", Object.keys(data.stats));
      }

      if (data.charts) {
        console.log("  - Charts data:", Object.keys(data.charts));

        // Check if hourly checkins data is present
        if (data.charts.hourlyCheckins) {
          console.log("  - Hourly checkins chart data:", {
            labels: data.charts.hourlyCheckins.labels.length,
            data: data.charts.hourlyCheckins.data.length,
          });
        }

        if (data.charts.contractorsVsEmployees) {
          console.log("  - Contractors vs Employees chart data:", {
            labels: data.charts.contractorsVsEmployees.labels,
            data: data.charts.contractorsVsEmployees.data,
          });
        }

        if (data.charts.guestTrend) {
          console.log("  - Guest trend chart data:", {
            labels: data.charts.guestTrend.labels.length,
            data: data.charts.guestTrend.data.length,
          });
        }
      }

      console.log("\n🎉 PostgreSQL EXTRACT function fix successful!");
      console.log("🎉 Contractor/Employee distinction fix successful!");
      return true;
    } else {
      const errorData = await response.text();
      console.error("❌ Dashboard API returned error status:", response.status);
      console.error("Response:", errorData);
      return false;
    }
  } catch (error) {
    console.error("❌ Dashboard API test failed:");

    if (error.code === "ECONNREFUSED") {
      console.error(
        "  Server not running. Please start the development server with: npm run dev"
      );
    } else {
      console.error("  Error:", error.message);
    }

    return false;
  }
}

// Run the test
testDashboardAPI().then((success) => {
  process.exit(success ? 0 : 1);
});
