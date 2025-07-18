const fs = require("fs");
const path = require("path");

console.log("🧪 Testing Logo Implementation on Admin Auth Pages...\n");

// Test 1: Check if logo.svg exists
console.log("1. Checking logo file...");
const logoPath = path.join(__dirname, "../public/logo.svg");
if (fs.existsSync(logoPath)) {
  console.log("✅ logo.svg exists in public directory");
} else {
  console.log("❌ logo.svg not found");
  process.exit(1);
}

// Test 2: Check login page
console.log("\n2. Checking login page...");
const loginPath = path.join(__dirname, "../pages/admin/login.js");
if (fs.existsSync(loginPath)) {
  const loginContent = fs.readFileSync(loginPath, "utf8");
  if (
    loginContent.includes("Image") &&
    loginContent.includes("/logo.svg") &&
    loginContent.includes("logoContainer") &&
    loginContent.includes("UHP Canteen Logo")
  ) {
    console.log("✅ Login page has logo implementation");
  } else {
    console.log("❌ Login page missing logo implementation");
    process.exit(1);
  }
} else {
  console.log("❌ Login page not found");
  process.exit(1);
}

// Test 3: Check forgot password page
console.log("\n3. Checking forgot password page...");
const forgotPasswordPath = path.join(
  __dirname,
  "../pages/admin/forgot-password.js"
);
if (fs.existsSync(forgotPasswordPath)) {
  const forgotPasswordContent = fs.readFileSync(forgotPasswordPath, "utf8");
  if (
    forgotPasswordContent.includes("Image") &&
    forgotPasswordContent.includes("/logo.svg") &&
    forgotPasswordContent.includes("logoContainer") &&
    forgotPasswordContent.includes("UHP Canteen Logo")
  ) {
    console.log("✅ Forgot password page has logo implementation");
  } else {
    console.log("❌ Forgot password page missing logo implementation");
    process.exit(1);
  }
} else {
  console.log("❌ Forgot password page not found");
  process.exit(1);
}

// Test 4: Check reset password page
console.log("\n4. Checking reset password page...");
const resetPasswordPath = path.join(
  __dirname,
  "../pages/admin/reset-password.js"
);
if (fs.existsSync(resetPasswordPath)) {
  const resetPasswordContent = fs.readFileSync(resetPasswordPath, "utf8");
  if (
    resetPasswordContent.includes("Image") &&
    resetPasswordContent.includes("/logo.svg") &&
    resetPasswordContent.includes("logoContainer") &&
    resetPasswordContent.includes("UHP Canteen Logo")
  ) {
    console.log("✅ Reset password page has logo implementation");
  } else {
    console.log("❌ Reset password page missing logo implementation");
    process.exit(1);
  }
} else {
  console.log("❌ Reset password page not found");
  process.exit(1);
}

// Test 5: Check CSS styles
console.log("\n5. Checking CSS styles...");
const cssPath = path.join(__dirname, "../styles/AdminLogin.module.css");
if (fs.existsSync(cssPath)) {
  const cssContent = fs.readFileSync(cssPath, "utf8");
  if (
    cssContent.includes(".logoContainer") &&
    cssContent.includes(".logo") &&
    cssContent.includes("drop-shadow") &&
    cssContent.includes("@media (max-width: 600px)")
  ) {
    console.log("✅ CSS styles for logo implemented");
  } else {
    console.log("❌ CSS styles for logo missing");
    process.exit(1);
  }
} else {
  console.log("❌ CSS file not found");
  process.exit(1);
}

// Test 6: Check logo dimensions and styling
console.log("\n6. Checking logo dimensions and styling...");
const loginContent = fs.readFileSync(loginPath, "utf8");
const cssContent = fs.readFileSync(cssPath, "utf8");

// Check for proper dimensions
if (
  loginContent.includes("width={120}") &&
  loginContent.includes("height={54}")
) {
  console.log("✅ Logo dimensions set correctly (120x54)");
} else {
  console.log("❌ Logo dimensions not set correctly");
  process.exit(1);
}

// Check for responsive design
if (
  cssContent.includes("width: 100px") &&
  cssContent.includes("height: 45px")
) {
  console.log("✅ Responsive logo sizing implemented");
} else {
  console.log("❌ Responsive logo sizing missing");
  process.exit(1);
}

// Check for visual effects
if (cssContent.includes("drop-shadow") && cssContent.includes("filter:")) {
  console.log("✅ Logo visual effects implemented");
} else {
  console.log("❌ Logo visual effects missing");
  process.exit(1);
}

console.log("\n🎉 Logo Implementation Test Completed Successfully!");
console.log("\n📋 Logo Implementation Summary:");
console.log("✅ Logo file exists in public directory");
console.log("✅ Login page has logo with proper styling");
console.log("✅ Forgot password page has logo with proper styling");
console.log("✅ Reset password page has logo with proper styling");
console.log("✅ CSS styles include logo container and responsive design");
console.log("✅ Logo has proper dimensions (120x54) and responsive sizing");
console.log("✅ Logo has visual effects (drop shadow)");
console.log("\n🚀 All admin auth pages now have beautiful, branded logos!");
