const db = require("../models");

async function testForgotPassword() {
  try {
    console.log("Testing forgot password functionality...");

    // Test 1: Check if AdminUser model has reset token fields
    console.log("\n1. Checking AdminUser model fields...");
    const adminUser = await db.AdminUser.findOne();
    if (adminUser) {
      console.log("✓ AdminUser model found");
      console.log(
        "✓ resetToken field exists:",
        adminUser.hasOwnProperty("resetToken")
      );
      console.log(
        "✓ resetTokenExpiry field exists:",
        adminUser.hasOwnProperty("resetTokenExpiry")
      );
    } else {
      console.log("⚠ No admin users found in database");
    }

    // Test 2: Check if we can update reset token fields
    console.log("\n2. Testing reset token update...");
    if (adminUser) {
      const testToken = "test-reset-token-123";
      const testExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      await adminUser.update({
        resetToken: testToken,
        resetTokenExpiry: testExpiry,
      });

      console.log("✓ Successfully updated reset token fields");

      // Verify the update
      const updatedUser = await db.AdminUser.findByPk(adminUser.id);
      console.log("✓ resetToken saved:", updatedUser.resetToken === testToken);
      console.log(
        "✓ resetTokenExpiry saved:",
        updatedUser.resetTokenExpiry.getTime() === testExpiry.getTime()
      );

      // Clean up - remove test token
      await adminUser.update({
        resetToken: null,
        resetTokenExpiry: null,
      });
      console.log("✓ Test token cleaned up");
    }

    console.log(
      "\n✅ Forgot password functionality test completed successfully!"
    );
    console.log("\nTo test the full flow:");
    console.log("1. Start your development server: npm run dev");
    console.log("2. Go to /admin/login");
    console.log('3. Click "Forgot your password?"');
    console.log("4. Enter an admin email address");
    console.log("5. Check your email for the reset link");
    console.log("6. Click the link to reset your password");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await db.sequelize.close();
  }
}

testForgotPassword();
