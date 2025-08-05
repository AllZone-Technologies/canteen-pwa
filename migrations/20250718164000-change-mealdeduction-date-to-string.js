"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("MealDeductions", "date", {
      type: Sequelize.STRING,
      allowNull: false,
      comment:
        "Deduction period (21st to 20th format: '21 January 2024 - 20 February 2024')",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("MealDeductions", "date", {
      type: Sequelize.DATEONLY,
      allowNull: false,
      comment: "Date of deduction",
    });
  },
};
