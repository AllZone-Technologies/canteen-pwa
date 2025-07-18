const fs = require("fs");
const path = require("path");

console.log("🧪 Final Admin Context Fix Verification...\n");

// Test 1: Check AdminLayout
console.log("1. Checking AdminLayout...");
const adminLayoutPath = path.join(__dirname, "../components/AdminLayout.js");
const adminLayoutContent = fs.readFileSync(adminLayoutPath, "utf8");

if (
  adminLayoutContent.includes("AdminProvider, useAdmin") &&
  adminLayoutContent.includes("function AdminLayoutContent") &&
  adminLayoutContent.includes("<AdminProvider>")
) {
  console.log("✅ AdminLayout correctly provides AdminProvider internally");
} else {
  console.log("❌ AdminLayout missing AdminProvider integration");
  process.exit(1);
}

// Test 2: Check Profile Page
console.log("\n2. Checking Profile Page...");
const profilePath = path.join(__dirname, "../pages/admin/profile.js");
const profileContent = fs.readFileSync(profilePath, "utf8");

if (
  profileContent.includes("AdminProvider, useAdmin") &&
  profileContent.includes("function AdminProfileContent") &&
  profileContent.includes("export default function AdminProfile") &&
  profileContent.includes("<AdminProvider>") &&
  profileContent.includes("<AdminProfileContent />")
) {
  console.log("✅ Profile page correctly wrapped with AdminProvider");
} else {
  console.log("❌ Profile page missing AdminProvider wrapper");
  process.exit(1);
}

// Test 3: Check Dashboard Page
console.log("\n3. Checking Dashboard Page...");
const dashboardPath = path.join(__dirname, "../pages/admin/dashboard.js");
const dashboardContent = fs.readFileSync(dashboardPath, "utf8");

if (
  !dashboardContent.includes("AdminWrapper") &&
  dashboardContent.includes("AdminLayout")
) {
  console.log("✅ Dashboard page uses AdminLayout without AdminWrapper");
} else {
  console.log("❌ Dashboard page still uses AdminWrapper");
  process.exit(1);
}

// Test 4: Check Other Admin Pages
console.log("\n4. Checking Other Admin Pages...");
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

// Test 5: Check Context File
console.log("\n5. Checking Admin Context...");
const contextPath = path.join(__dirname, "../context/admin-context.js");
const contextContent = fs.readFileSync(contextPath, "utf8");

if (
  contextContent.includes("AdminProvider") &&
  contextContent.includes("useAdmin") &&
  contextContent.includes("useContext(AdminContext)")
) {
  console.log("✅ Admin context properly configured");
} else {
  console.log("❌ Admin context missing required exports");
  process.exit(1);
}

console.log("\n🎉 All Admin Context Fixes Verified Successfully!");
console.log("\n📋 Final Summary:");
console.log("✅ AdminLayout provides AdminProvider internally");
console.log("✅ Profile page has its own AdminProvider wrapper");
console.log("✅ Dashboard page uses AdminLayout without AdminWrapper");
console.log("✅ All other admin pages use AdminLayout directly");
console.log("✅ Admin context is properly configured");
console.log(
  '\n🚀 The "useAdmin must be used within an AdminProvider" error should now be completely resolved!'
);
