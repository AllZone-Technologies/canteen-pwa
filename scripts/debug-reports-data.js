const fetchWrapper = require("../lib/fetchWrapper");

async function debugReportsData() {
  try {
    console.log("Debugging reports data issue...");

    // First, let's check what data exists in checkins
    console.log("\n1. Checking checkins API data:");
    const checkinsResponse = await fetchWrapper("/api/admin/checkins");
    const checkinsData = await checkinsResponse.json();
    
    console.log("   - Total checkins:", checkinsData.totalItems);
    console.log("   - Sample checkin dates:");
    checkinsData.checkins.slice(0, 3).forEach((checkin, i) => {
      console.log(`     ${i + 1}. ${checkin.checkin_time} (${checkin.name})`);
    });

    // Now test the reports API with a broader date range
    console.log("\n2. Testing reports API with broader date range:");
    const reportsResponse = await fetchWrapper("/api/admin/reports/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportType: "daily",
        format: "csv",
        startDate: "2025-07-01", // Broader range
        endDate: "2025-07-31",   // Broader range
        department: "all",
      }),
    });

    if (reportsResponse.ok) {
      const csvText = await reportsResponse.text();
      const lines = csvText.split("\n").filter(line => line.trim());
      
      console.log("   - CSV lines:", lines.length);
      console.log("   - Headers:", lines[0]);
      
      if (lines.length > 1) {
        console.log("   - Data rows found:", lines.length - 1);
        lines.slice(1, 4).forEach((line, i) => {
          console.log(`     Row ${i + 1}: ${line}`);
        });
      } else {
        console.log("   - No data rows found");
      }
    } else {
      console.log("   - Reports API error:", reportsResponse.status);
    }

    // Test with specific July 10th date
    console.log("\n3. Testing with July 10th specifically:");
    const july10Response = await fetchWrapper("/api/admin/reports/download", {
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

    if (july10Response.ok) {
      const csvText = await july10Response.text();
      const lines = csvText.split("\n").filter(line => line.trim());
      
      console.log("   - CSV lines for July 10th:", lines.length);
      if (lines.length > 1) {
        console.log("   - Found data for July 10th!");
        lines.slice(1, 3).forEach((line, i) => {
          console.log(`     Row ${i + 1}: ${line}`);
        });
      } else {
        console.log("   - No data found for July 10th");
      }
    }

  } catch (error) {
    console.error("Debug failed:", error.message);
  }
}

debugReportsData();
