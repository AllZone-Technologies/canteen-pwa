"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("VisitLogs", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Employees",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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

    // Add index for faster queries
    await queryInterface.addIndex("VisitLogs", ["employee_id"]);
    await queryInterface.addIndex("VisitLogs", ["checkin_time"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("VisitLogs");
  },
};
