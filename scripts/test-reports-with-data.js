const fetchWrapper = require("../lib/fetchWrapper");

async function testReportsWithData() {
  try {
    console.log("Testing reports download with actual data...");

    // Test with July 10th date where we know there's data
    const response = await fetchWrapper("/api/admin/reports/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportType: "daily",
        format: "csv",
        startDate: "2025-07-10",
        endDate: "2025-07-10",
        department: "all",
      }),
    });

    if (response.ok) {
      console.log("✅ Reports download API is working correctly!");
      console.log("📊 Response status:", response.status);

      // Read the CSV content
      const text = await response.text();
      const lines = text.split("\n");

      console.log("📋 CSV Content Analysis:");
      console.log("  - Total lines:", lines.length);

      if (lines.length > 0) {
        console.log("  - Headers:", lines[0]);
      }

      if (lines.length > 1) {
        console.log("  - Data rows found:", lines.length - 1);

        // Show first few data rows
        for (let i = 1; i < Math.min(lines.length, 4); i++) {
          if (lines[i].trim()) {
            console.log(`  - Row ${i}:`, lines[i]);
          }
        }

        if (lines.length > 1) {
          console.log("\n🎉 Reports download includes actual data!");
          console.log("✅ Data rows are being generated");
          console.log("✅ CSV format is working with content");
          return true;
        } else {
          console.log("\n⚠️  No data rows found in CSV");
          console.log(
            "   This might indicate no check-ins for the specified date range"
          );
          return false;
        }
      } else {
        console.log("\n❌ Only headers found, no data rows");
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
    console.error("❌ Reports with data test failed:");

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
testReportsWithData().then((success) => {
  process.exit(success ? 0 : 1);
});
