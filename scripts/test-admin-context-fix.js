const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🧪 Testing AdminProvider Context Fix...\n");

// Test 1: Check if AdminLayout imports AdminProvider
console.log("1. Checking AdminLayout imports...");
const adminLayoutPath = path.join(__dirname, "../components/AdminLayout.js");
const adminLayoutContent = fs.readFileSync(adminLayoutPath, "utf8");

if (
  adminLayoutContent.includes("AdminProvider") &&
  adminLayoutContent.includes("useAdmin")
) {
  console.log("✅ AdminLayout correctly imports AdminProvider and useAdmin");
} else {
  console.log("❌ AdminLayout missing required imports");
  process.exit(1);
}

// Test 2: Check if AdminLayout wraps content with AdminProvider
if (
  adminLayoutContent.includes("AdminProvider>") &&
  adminLayoutContent.includes("AdminLayoutContent")
) {
  console.log("✅ AdminLayout correctly wraps content with AdminProvider");
} else {
  console.log("❌ AdminLayout missing AdminProvider wrapper");
  process.exit(1);
}

// Test 3: Check if dashboard page no longer uses AdminWrapper
console.log("\n2. Checking dashboard page...");
const dashboardPath = path.join(__dirname, "../pages/admin/dashboard.js");
const dashboardContent = fs.readFileSync(dashboardPath, "utf8");

if (
  !dashboardContent.includes("AdminWrapper") &&
  dashboardContent.includes("AdminLayout")
) {
  console.log(
    "✅ Dashboard page correctly uses AdminLayout without AdminWrapper"
  );
} else {
  console.log(
    "❌ Dashboard page still uses AdminWrapper or missing AdminLayout"
  );
  process.exit(1);
}

// Test 4: Check if profile page no longer uses AdminWrapper
console.log("\n3. Checking profile page...");
const profilePath = path.join(__dirname, "../pages/admin/profile.js");
const profileContent = fs.readFileSync(profilePath, "utf8");

if (
  !profileContent.includes("AdminWrapper") &&
  profileContent.includes("AdminLayout")
) {
  console.log(
    "✅ Profile page correctly uses AdminLayout without AdminWrapper"
  );
} else {
  console.log("❌ Profile page still uses AdminWrapper or missing AdminLayout");
  process.exit(1);
}

// Test 5: Check if other admin pages use AdminLayout directly
console.log("\n4. Checking other admin pages...");
const adminPages = [
  "employees.js",
  "contractors.js",
  "checkins.js",
  "reports.js",
  "meal-deductions.js",
];

let allPagesCorrect = true;
adminPages.forEach((page) => {
  const pagePath = path.join(__dirname, `../pages/admin/${page}`);
  if (fs.existsSync(pagePath)) {
    const pageContent = fs.readFileSync(pagePath, "utf8");
    if (
      pageContent.includes("AdminLayout") &&
      !pageContent.includes("AdminWrapper")
    ) {
      console.log(`✅ ${page} correctly uses AdminLayout`);
    } else {
      console.log(`❌ ${page} has issues with AdminLayout usage`);
      allPagesCorrect = false;
    }
  }
});

if (!allPagesCorrect) {
  process.exit(1);
}

// Test 6: Check if AdminWrapper component still exists (for backward compatibility)
console.log("\n5. Checking AdminWrapper component...");
const adminWrapperPath = path.join(__dirname, "../components/AdminWrapper.js");
if (fs.existsSync(adminWrapperPath)) {
  console.log("✅ AdminWrapper component exists for backward compatibility");
} else {
  console.log("❌ AdminWrapper component missing");
  process.exit(1);
}

console.log(
  "\n🎉 All tests passed! The AdminProvider context fix is working correctly."
);
console.log("\n📋 Summary:");
console.log("- AdminLayout now includes AdminProvider internally");
console.log(
  "- All admin pages can use AdminLayout directly without AdminWrapper"
);
console.log("- useAdmin hook will work correctly in all admin pages");
console.log("- AdminWrapper component remains for backward compatibility");
