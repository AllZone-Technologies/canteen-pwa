const db = require("../models");

async function testManagerSystem() {
  try {
    console.log("Testing Manager Role System...\n");

    // Test 1: Check if AdminUser model has role field
    console.log("1. Checking AdminUser model structure...");
    const adminUserAttributes = Object.keys(db.AdminUser.rawAttributes);
    if (adminUserAttributes.includes('role')) {
      console.log("✅ Role field exists in AdminUser model");
    } else {
      console.log("❌ Role field missing from AdminUser model");
      return;
    }

    // Test 2: Check existing admin users
    console.log("\n2. Checking existing admin users...");
    const existingUsers = await db.AdminUser.findAll({
      attributes: ['id', 'name', 'email', 'role']
    });
    
    if (existingUsers.length === 0) {
      console.log("⚠️  No admin users found in database");
    } else {
      console.log(`✅ Found ${existingUsers.length} admin user(s):`);
      existingUsers.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }

    // Test 3: Test creating a manager user
    console.log("\n3. Testing manager user creation...");
    try {
      const testManager = await db.AdminUser.create({
        name: "Test Manager",
        email: "test.manager@example.com",
        password: "testpassword123",
        role: "manager"
      });
      console.log("✅ Test manager created successfully");
      console.log(`   - ID: ${testManager.id}`);
      console.log(`   - Role: ${testManager.role}`);

      // Clean up test user
      await testManager.destroy();
      console.log("✅ Test manager cleaned up");
    } catch (error) {
      console.log("❌ Failed to create test manager:", error.message);
    }

    // Test 4: Test role validation
    console.log("\n4. Testing role validation...");
    try {
      await db.AdminUser.create({
        name: "Invalid Role User",
        email: "invalid.role@example.com",
        password: "testpassword123",
        role: "invalid_role"
      });
      console.log("❌ Should have failed with invalid role");
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        console.log("✅ Role validation working correctly");
      } else {
        console.log("⚠️  Unexpected error during role validation:", error.message);
      }
    }

    // Test 5: Check database connection
    console.log("\n5. Testing database connection...");
    await db.sequelize.authenticate();
    console.log("✅ Database connection successful");

    console.log("\n🎉 Manager role system tests completed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await db.sequelize.close();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testManagerSystem();
}

module.exports = testManagerSystem;
