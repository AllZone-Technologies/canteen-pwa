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
      { shift_type: "8hr" },
      {
        shift_type: "8h",
      }
    );

    await queryInterface.bulkUpdate(
      "Employees",
      { shift_type: "12hr" },
      {
        shift_type: "12h",
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
      { shift_type: "8h" },
      {
        shift_type: "8hr",
      }
    );

    await queryInterface.bulkUpdate(
      "Employees",
      { shift_type: "12h" },
      {
        shift_type: "12hr",
      }
    );
  },
};
