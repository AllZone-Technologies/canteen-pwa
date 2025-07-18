"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Employees", "qr_code_data", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Employees", "qr_code_data", {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  },
};
