"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("VisitLogs", "username", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "employee_id",
    });

    // Update existing records with employee names
    await queryInterface.sequelize.query(`
      UPDATE "VisitLogs" vl
      SET username = e.name
      FROM "Employees" e
      WHERE vl.employee_id = e.id
    `);

    // Make the column not null after updating existing records
    await queryInterface.changeColumn("VisitLogs", "username", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("VisitLogs", "username");
  },
};
