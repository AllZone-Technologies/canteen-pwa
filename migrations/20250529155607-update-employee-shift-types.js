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
    await queryInterface.bulkUpdate(
      "Employees",
      { shift_type: "8h" },
      {
        shift_type: ["Morning", "Afternoon"],
      }
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.bulkUpdate(
      "Employees",
      { shift_type: null },
      {
        shift_type: "8h",
      }
    );
  },
};
