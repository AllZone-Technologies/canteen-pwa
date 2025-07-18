"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the existing VisitLogs table
    await queryInterface.dropTable("VisitLogs");

    // Recreate the VisitLogs table with the correct schema
    await queryInterface.createTable("VisitLogs", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      employee_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: "Employees",
          key: "employee_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      checkin_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      source_type: {
        type: Sequelize.ENUM("QR", "manual"),
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Add indexes for faster queries
    await queryInterface.addIndex("VisitLogs", ["employee_id"]);
    await queryInterface.addIndex("VisitLogs", ["checkin_time"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("VisitLogs");
  },
};
