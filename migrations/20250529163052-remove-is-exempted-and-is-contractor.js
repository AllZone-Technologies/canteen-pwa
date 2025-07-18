"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    // Remove is_exempted column
    await queryInterface.removeColumn("Employees", "is_exempted");

    // Remove is_contractor column
    await queryInterface.removeColumn("Employees", "is_contractor");
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // Add is_exempted column back
    await queryInterface.addColumn("Employees", "is_exempted", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: true, // Assuming it was nullable or had a default
    });

    // Add is_contractor column back
    await queryInterface.addColumn("Employees", "is_contractor", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: true, // Assuming it was nullable or had a default
    });
  },
};
