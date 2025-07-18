require("dotenv").config();
const db = require("../models");
const bcrypt = require("bcryptjs");

async function createAdminUser() {
  try {
    await db.sequelize.authenticate();
    console.log("Database connection successful");

    const adminUser = await db.AdminUser.create({
      email: "admin@example.com",
      password: "admin123", // This will be hashed by the model hook
      name: "Admin User",
      role: "admin",
    });

    console.log("Admin user created successfully:", {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    });

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();
