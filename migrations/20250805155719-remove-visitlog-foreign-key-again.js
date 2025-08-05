"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the foreign key constraint from VisitLogs table
    try {
      await queryInterface.removeConstraint(
        "VisitLogs",
        "VisitLogs_employee_id_fkey"
      );
      console.log("✅ Removed foreign key constraint from VisitLogs table");
    } catch (error) {
      console.log("Foreign key constraint may not exist, continuing...");
    }
  },

  async down(queryInterface, Sequelize) {
    // Add back the foreign key constraint
    await queryInterface.addConstraint("VisitLogs", {
      fields: ["employee_id"],
      type: "foreign key",
      name: "VisitLogs_employee_id_fkey",
      references: {
        table: "Employees",
        field: "employee_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },
};
