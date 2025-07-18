"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if shift_type column exists before trying to remove it
    const tableDescription = await queryInterface.describeTable("Employees");
    if (tableDescription.shift_type) {
      await queryInterface.removeColumn("Employees", "shift_type");
    }

    // Check if columns don't already exist before adding them
    if (!tableDescription.firstname) {
      await queryInterface.addColumn("Employees", "firstname", {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }

    if (!tableDescription.lastname) {
      await queryInterface.addColumn("Employees", "lastname", {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }

    if (!tableDescription.nationality) {
      await queryInterface.addColumn("Employees", "nationality", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Remove the old name column after adding firstname and lastname (if it exists)
    if (tableDescription.name) {
      await queryInterface.removeColumn("Employees", "name");
    }
  },

  async down(queryInterface, Sequelize) {
    // Add back the name column
    await queryInterface.addColumn("Employees", "name", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // Remove the new columns
    await queryInterface.removeColumn("Employees", "firstname");
    await queryInterface.removeColumn("Employees", "lastname");
    await queryInterface.removeColumn("Employees", "nationality");

    // Add back shift_type column
    await queryInterface.addColumn("Employees", "shift_type", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
