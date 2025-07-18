const fs = require("fs");
const path = require("path");

console.log("🧪 Testing Profile Page Fix...\n");

// Check if profile page has the correct structure
const profilePath = path.join(__dirname, "../pages/admin/profile.js");
const profileContent = fs.readFileSync(profilePath, "utf8");

console.log("1. Checking profile page structure...");

// Check if AdminProvider is imported
if (profileContent.includes("AdminProvider, useAdmin")) {
  console.log("✅ AdminProvider correctly imported");
} else {
  console.log("❌ AdminProvider not imported correctly");
  process.exit(1);
}

// Check if AdminProfileContent function exists
if (profileContent.includes("function AdminProfileContent()")) {
  console.log("✅ AdminProfileContent function exists");
} else {
  console.log("❌ AdminProfileContent function missing");
  process.exit(1);
}

// Check if useAdmin is used within AdminProfileContent
if (
  profileContent.includes("const { adminInfo, refreshAdminInfo } = useAdmin();")
) {
  console.log("✅ useAdmin hook used within AdminProfileContent");
} else {
  console.log("❌ useAdmin hook not found in AdminProfileContent");
  process.exit(1);
}

// Check if AdminProfile wrapper function exists
if (profileContent.includes("export default function AdminProfile()")) {
  console.log("✅ AdminProfile wrapper function exists");
} else {
  console.log("❌ AdminProfile wrapper function missing");
  process.exit(1);
}

// Check if AdminProvider wraps AdminProfileContent
if (
  profileContent.includes("<AdminProvider>") &&
  profileContent.includes("<AdminProfileContent />")
) {
  console.log("✅ AdminProvider correctly wraps AdminProfileContent");
} else {
  console.log("❌ AdminProvider does not wrap AdminProfileContent");
  process.exit(1);
}

console.log("\n🎉 Profile page fix verified successfully!");
console.log("\n📋 Summary:");
console.log("- Profile page now has AdminProvider wrapper");
console.log("- useAdmin hook is used within AdminProfileContent");
console.log("- AdminProfileContent is wrapped with AdminProvider");
console.log("- This should resolve the context error");
