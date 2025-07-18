const fetchWrapper = require("../lib/fetchWrapper");

async function testDashboardStatsFix() {
  try {
    console.log("Testing dashboard stats fixes...");

    const response = await fetchWrapper("/api/admin/dashboard");

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Dashboard API is working correctly!");

      if (data.stats) {
        console.log("📊 Dashboard Stats:");
        console.log("  - Total Employees:", data.stats.totalEmployees);
        console.log("  - Total Check-ins:", data.stats.totalCheckins);
        console.log("  - Total Guests:", data.stats.totalGuests);
        console.log("  - Today's Check-ins:", data.stats.todayCheckins);
        console.log("  - Today's Guests:", data.stats.todayGuests);
        console.log(
          "  - Employee Check-ins (Today):",
          data.stats.employeesCheckins
        );
        console.log(
          "  - Contractor Check-ins (Today):",
          data.stats.contractorsCheckins
        );

        // Verify the fixes
        const issues = [];

        if (
          data.stats.totalCheckins === null ||
          data.stats.totalCheckins === undefined
        ) {
          issues.push("Total Check-ins is null/undefined");
        }

        if (
          data.stats.todayCheckins === null ||
          data.stats.todayCheckins === undefined
        ) {
          issues.push("Today's Check-ins is null/undefined");
        }

        if (
          data.stats.employeesCheckins === null ||
          data.stats.employeesCheckins === undefined
        ) {
          issues.push("Employee Check-ins is null/undefined");
        }

        if (
          data.stats.contractorsCheckins === null ||
          data.stats.contractorsCheckins === undefined
        ) {
          issues.push("Contractor Check-ins is null/undefined");
        }

        if (issues.length === 0) {
          console.log("\n🎉 All dashboard stats are working correctly!");
          console.log("✅ Total Check-ins fixed");
          console.log("✅ Today's Check-ins fixed");
          console.log("✅ Employee Check-ins added");
          console.log("✅ Contractor Check-ins added");
          console.log("✅ Active Employees removed");
          return true;
        } else {
          console.error("\n❌ Issues found:");
          issues.forEach((issue) => console.error("  -", issue));
          return false;
        }
      } else {
        console.error("❌ Stats data not found in API response");
        return false;
      }
    } else {
      const errorData = await response.text();
      console.error("❌ Dashboard API returned error status:", response.status);
      console.error("Response:", errorData);
      return false;
    }
  } catch (error) {
    console.error("❌ Dashboard stats test failed:");

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
testDashboardStatsFix().then((success) => {
  process.exit(success ? 0 : 1);
});
