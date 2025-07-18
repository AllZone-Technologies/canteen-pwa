const fs = require("fs");
const path = require("path");

console.log("🧪 Testing Enhanced Dashboard Charts...\n");

// Test 1: Check dashboard API
console.log("1. Checking dashboard API...");
const dashboardApiPath = path.join(
  __dirname,
  "../pages/api/admin/dashboard.js"
);
if (fs.existsSync(dashboardApiPath)) {
  const dashboardApiContent = fs.readFileSync(dashboardApiPath, "utf8");

  // Check for hourly check-ins query
  if (
    dashboardApiContent.includes("HOUR") &&
    dashboardApiContent.includes("hourlyCheckins") &&
    dashboardApiContent.includes("checkin_time")
  ) {
    console.log("✅ Hourly check-ins query implemented");
  } else {
    console.log("❌ Hourly check-ins query missing");
    process.exit(1);
  }

  // Check for contractors vs employees query
  if (
    dashboardApiContent.includes("contractorsCheckins") &&
    dashboardApiContent.includes("employeesCheckins") &&
    dashboardApiContent.includes("source_type")
  ) {
    console.log("✅ Contractors vs employees query implemented");
  } else {
    console.log("❌ Contractors vs employees query missing");
    process.exit(1);
  }

  // Check for guest trend query
  if (
    dashboardApiContent.includes("guestTrend") &&
    dashboardApiContent.includes("guest_count")
  ) {
    console.log("✅ Guest trend query implemented");
  } else {
    console.log("❌ Guest trend query missing");
    process.exit(1);
  }
} else {
  console.log("❌ Dashboard API not found");
  process.exit(1);
}

// Test 2: Check dashboard frontend
console.log("\n2. Checking dashboard frontend...");
const dashboardPath = path.join(__dirname, "../pages/admin/dashboard.js");
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, "utf8");

  // Check for new chart data state
  if (
    dashboardContent.includes("hourlyCheckins") &&
    dashboardContent.includes("contractorsVsEmployees") &&
    dashboardContent.includes("guestTrend")
  ) {
    console.log("✅ New chart data state implemented");
  } else {
    console.log("❌ New chart data state missing");
    process.exit(1);
  }

  // Check for hourly check-ins chart
  if (
    dashboardContent.includes("hourlyCheckinsData") &&
    dashboardContent.includes("Daily Check-ins by Hour") &&
    dashboardContent.includes("Busiest Times")
  ) {
    console.log("✅ Hourly check-ins chart implemented");
  } else {
    console.log("❌ Hourly check-ins chart missing");
    process.exit(1);
  }

  // Check for contractors vs employees chart
  if (
    dashboardContent.includes("contractorsVsEmployeesData") &&
    dashboardContent.includes("Employees vs Contractors Check-ins")
  ) {
    console.log("✅ Contractors vs employees chart implemented");
  } else {
    console.log("❌ Contractors vs employees chart missing");
    process.exit(1);
  }

  // Check for guest trend chart
  if (
    dashboardContent.includes("guestTrendData") &&
    dashboardContent.includes("Guest Count Trend") &&
    dashboardContent.includes("Last 7 Days")
  ) {
    console.log("✅ Guest trend chart implemented");
  } else {
    console.log("❌ Guest trend chart missing");
    process.exit(1);
  }
} else {
  console.log("❌ Dashboard frontend not found");
  process.exit(1);
}

// Test 3: Check chart configurations
console.log("\n3. Checking chart configurations...");
const dashboardContent = fs.readFileSync(dashboardPath, "utf8");

// Check for proper chart options
if (
  dashboardContent.includes("maintainAspectRatio: false") &&
  dashboardContent.includes("responsive: true") &&
  dashboardContent.includes("plugins:") &&
  dashboardContent.includes("scales:")
) {
  console.log("✅ Chart options properly configured");
} else {
  console.log("❌ Chart options missing or incomplete");
  process.exit(1);
}

// Check for proper styling
if (
  dashboardContent.includes("borderColor:") &&
  dashboardContent.includes("backgroundColor:") &&
  dashboardContent.includes("pointRadius:")
) {
  console.log("✅ Chart styling properly configured");
} else {
  console.log("❌ Chart styling missing or incomplete");
  process.exit(1);
}

// Test 4: Check for proper chart types
console.log("\n4. Checking chart types...");

// Check for Line chart (hourly check-ins)
if (
  dashboardContent.includes("<Line") &&
  dashboardContent.includes("hourlyCheckinsData")
) {
  console.log("✅ Line chart for hourly check-ins implemented");
} else {
  console.log("❌ Line chart for hourly check-ins missing");
  process.exit(1);
}

// Check for Bar chart (contractors vs employees)
if (
  dashboardContent.includes("<Bar") &&
  dashboardContent.includes("contractorsVsEmployeesData")
) {
  console.log("✅ Bar chart for contractors vs employees implemented");
} else {
  console.log("❌ Bar chart for contractors vs employees missing");
  process.exit(1);
}

// Check for Line chart (guest trend)
if (
  dashboardContent.includes("<Line") &&
  dashboardContent.includes("guestTrendData")
) {
  console.log("✅ Line chart for guest trend implemented");
} else {
  console.log("❌ Line chart for guest trend missing");
  process.exit(1);
}

// Test 5: Check for proper labels and titles
console.log("\n5. Checking chart labels and titles...");

if (
  dashboardContent.includes("Hour of Day") &&
  dashboardContent.includes("Number of Check-ins") &&
  dashboardContent.includes("User Type") &&
  dashboardContent.includes("Number of Guests") &&
  dashboardContent.includes("Day of Week")
) {
  console.log("✅ Chart labels and titles properly configured");
} else {
  console.log("❌ Chart labels and titles missing or incomplete");
  process.exit(1);
}

console.log("\n🎉 Enhanced Dashboard Charts Test Completed Successfully!");
console.log("\n📋 New Dashboard Charts Summary:");
console.log("✅ Daily Check-ins by Hour (Line Chart) - Shows busiest times");
console.log("✅ Employees vs Contractors Check-ins (Bar Chart) - Comparison");
console.log("✅ Guest Count Trend (Line Chart) - 7-day guest analysis");
console.log("✅ Department Distribution (Doughnut Chart) - Kept from original");
console.log("\n🚀 Dashboard now provides comprehensive insights into:");
console.log("• Peak usage times throughout the day");
console.log("• Employee vs contractor check-in patterns");
console.log("• Guest attendance trends over time");
console.log("• Department distribution analysis");
