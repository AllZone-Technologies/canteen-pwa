"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("Employees", "qr_code_data", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("Employees", "qr_code_data", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
