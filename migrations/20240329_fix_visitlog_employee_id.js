"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Delete orphan VisitLogs before migration
    await queryInterface.sequelize.query(`
      DELETE FROM "VisitLogs"
      WHERE employee_id IS NOT NULL
        AND employee_id NOT IN (SELECT id FROM "Employees")
    `);

    // Add new column
    await queryInterface.addColumn("VisitLogs", "employee_id_str", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Update the new column with data from Employees table
    await queryInterface.sequelize.query(`
      UPDATE "VisitLogs" v
      SET employee_id_str = e.employee_id
      FROM "Employees" e
      WHERE v.employee_id = e.id
    `);

    // Make the new column not null after data migration
    await queryInterface.changeColumn("VisitLogs", "employee_id_str", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // Drop the old column and its foreign key
    await queryInterface
      .removeConstraint("VisitLogs", "VisitLogs_employee_id_fkey")
      .catch(() => {
        console.log("No foreign key constraint found to remove");
      });

    await queryInterface.removeColumn("VisitLogs", "employee_id");

    // Rename the new column to employee_id
    await queryInterface.renameColumn(
      "VisitLogs",
      "employee_id_str",
      "employee_id"
    );

    // Add new foreign key constraint
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

  down: async (queryInterface, Sequelize) => {
    // Add back the old column
    await queryInterface.addColumn("VisitLogs", "employee_id_int", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Update the old column with data from Employees table
    await queryInterface.sequelize.query(`
      UPDATE "VisitLogs" v
      SET employee_id_int = e.id
      FROM "Employees" e
      WHERE v.employee_id = e.employee_id
    `);

    // Make the old column not null after data migration
    await queryInterface.changeColumn("VisitLogs", "employee_id_int", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // Drop the new column and its foreign key
    await queryInterface
      .removeConstraint("VisitLogs", "VisitLogs_employee_id_fkey")
      .catch(() => {
        console.log("No foreign key constraint found to remove");
      });

    await queryInterface.removeColumn("VisitLogs", "employee_id");

    // Rename the old column back to employee_id
    await queryInterface.renameColumn(
      "VisitLogs",
      "employee_id_int",
      "employee_id"
    );

    // Add back the original foreign key constraint
    await queryInterface.addConstraint("VisitLogs", {
      fields: ["employee_id"],
      type: "foreign key",
      name: "VisitLogs_employee_id_fkey",
      references: {
        table: "Employees",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },
};
