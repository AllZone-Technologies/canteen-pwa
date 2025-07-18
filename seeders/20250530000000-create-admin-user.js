"use strict";

const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    await queryInterface.bulkInsert(
      "AdminUsers",
      [
        {
          email: "admin@example.com",
          password: hashedPassword,
          name: "Admin User",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(
      "AdminUsers",
      { email: "admin@example.com" },
      {}
    );
  },
};
