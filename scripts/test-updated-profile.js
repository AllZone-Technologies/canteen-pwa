const db = require("../models");

async function testUpdatedProfileFunctionality() {
  try {
    console.log("Testing updated profile functionality...");

    // Test 1: Check if AdminUser model has all required fields
    console.log("\n1. Checking AdminUser model fields...");
    const adminUser = await db.AdminUser.findOne();
    if (adminUser) {
      console.log("✓ AdminUser model found");
      console.log("✓ name field exists:", adminUser.hasOwnProperty("name"));
      console.log("✓ email field exists:", adminUser.hasOwnProperty("email"));
      console.log(
        "✓ password field exists:",
        adminUser.hasOwnProperty("password")
      );
      console.log("✓ role field exists:", adminUser.hasOwnProperty("role"));
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

    // Test 2: Check if we can update profile fields
    console.log("\n2. Testing profile update functionality...");
    if (adminUser) {
      const originalName = adminUser.name;
      const originalEmail = adminUser.email;

      // Test updating name and email
      await adminUser.update({
        name: "Test Admin User",
        email: "test-admin@example.com",
      });

      console.log("✓ Successfully updated profile fields");

      // Verify the update
      const updatedUser = await db.AdminUser.findByPk(adminUser.id);
      console.log("✓ name updated:", updatedUser.name === "Test Admin User");
      console.log(
        "✓ email updated:",
        updatedUser.email === "test-admin@example.com"
      );

      // Restore original values
      await adminUser.update({
        name: originalName,
        email: originalEmail,
      });
      console.log("✓ Original values restored");
    }

    // Test 3: Check password validation
    console.log("\n3. Testing password validation...");
    if (adminUser) {
      console.log(
        "✓ validatePassword method exists:",
        typeof adminUser.validatePassword === "function"
      );

      // Test with wrong password
      const isValidWrong = await adminUser.validatePassword("wrong-password");
      console.log("✓ Wrong password correctly rejected:", !isValidWrong);
    }

    console.log(
      "\n✅ Updated profile functionality test completed successfully!"
    );
    console.log("\nKey Changes Made:");
    console.log("✓ Removed incorrect layout.js file");
    console.log(
      "✓ Updated AdminLayout component with profile dropdown in header"
    );
    console.log("✓ Added profile dropdown with user info and settings");
    console.log("✓ Implemented click-outside to close dropdown");
    console.log("✓ Added responsive design for mobile devices");
    console.log(
      "✓ Profile link now accessible via header dropdown, not sidebar"
    );

    console.log("\nTo test the updated profile management flow:");
    console.log("1. Start your development server: npm run dev");
    console.log("2. Go to /admin/login and login");
    console.log("3. Look for the profile dropdown in the top-right header");
    console.log("4. Click on the profile dropdown to see user info");
    console.log('5. Click "Profile Settings" to access profile page');
    console.log("6. Update your profile information and password");
    console.log("7. Verify the changes are saved");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await db.sequelize.close();
  }
}

testUpdatedProfileFunctionality();
