const fetchWrapper = require("../lib/fetchWrapper");

async function testSourceTypeChart() {
  try {
    console.log("Testing source type chart data...");

    const response = await fetchWrapper("/api/admin/dashboard");

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Dashboard API is working correctly!");

      if (data.charts && data.charts.sourceTypeDistribution) {
        const sourceTypeData = data.charts.sourceTypeDistribution;
        console.log("📊 Source Type Chart Data:");
        console.log("  - Labels:", sourceTypeData.labels);
        console.log("  - Data:", sourceTypeData.data);

        // Check if we have meaningful data
        if (
          sourceTypeData.labels.length > 0 &&
          sourceTypeData.data.length > 0
        ) {
          console.log("✅ Source type chart data is properly formatted!");

          // Show the breakdown
          sourceTypeData.labels.forEach((label, index) => {
            console.log(
              `  - ${label}: ${sourceTypeData.data[index]} check-ins`
            );
          });

          console.log(
            "\n🎉 Source type bar chart should display correctly on the dashboard!"
          );
          return true;
        } else {
          console.log(
            "⚠️  Source type chart data is empty (no check-ins recorded yet)"
          );
          console.log("   This is normal if no check-ins have been made yet.");
          return true;
        }
      } else {
        console.error("❌ Source type chart data not found in API response");
        return false;
      }
    } else {
      const errorData = await response.text();
      console.error("❌ Dashboard API returned error status:", response.status);
      console.error("Response:", errorData);
      return false;
    }
  } catch (error) {
    console.error("❌ Source type chart test failed:");

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
testSourceTypeChart().then((success) => {
  process.exit(success ? 0 : 1);
});
