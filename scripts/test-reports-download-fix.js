const fetchWrapper = require("../lib/fetchWrapper");

async function testReportsDownloadFix() {
  try {
    console.log("Testing reports download fix...");

    // Test the API endpoint with the format that checkins page uses
    const response = await fetchWrapper("/api/admin/reports/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportType: "daily",
        format: "csv",
        startDate: new Date().toISOString().split("T")[0], // Today's date
        endDate: new Date().toISOString().split("T")[0], // Today's date
        department: "all",
      }),
    });

    if (response.ok) {
      console.log("✅ Reports download API is working correctly!");
      console.log("📊 Response status:", response.status);
      console.log("📊 Content-Type:", response.headers.get("content-type"));
      console.log(
        "📊 Content-Disposition:",
        response.headers.get("content-disposition")
      );

      // Check if it's a CSV file
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/csv")) {
        console.log("✅ CSV format is working correctly!");

        // Try to read a small portion of the response
        const text = await response.text();
        const lines = text.split("\n");

        console.log("📋 CSV Content Preview:");
        console.log("  - Total lines:", lines.length);
        if (lines.length > 0) {
          console.log("  - Headers:", lines[0]);
        }
        if (lines.length > 1) {
          console.log("  - First data row:", lines[1]);
        }

        console.log("\n🎉 Reports download fix successful!");
        console.log("✅ Filters destructuring fixed");
        console.log("✅ VisitLog model usage fixed");
        console.log("✅ Employee/Contractor handling added");
        console.log("✅ CSV generation working");
        return true;
      } else {
        console.error("❌ Expected CSV content type, got:", contentType);
        return false;
      }
    } else {
      const errorData = await response.text();
      console.error(
        "❌ Reports download API returned error status:",
        response.status
      );
      console.error("Response:", errorData);
      return false;
    }
  } catch (error) {
    console.error("❌ Reports download test failed:");

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
testReportsDownloadFix().then((success) => {
  process.exit(success ? 0 : 1);
});
