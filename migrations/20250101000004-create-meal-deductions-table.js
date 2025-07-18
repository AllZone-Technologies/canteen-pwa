"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("MealDeductions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      employee_id: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: "Employee number",
      },
      wage_type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "3020",
        comment: "Fixed wage type",
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: "Deduction amount in QAR",
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: "Date of deduction",
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "QAR",
        comment: "Currency code",
      },
      visit_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: "Number of visits on this date",
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

    // Add unique index for employee_id and date combination
    await queryInterface.addIndex("MealDeductions", {
      fields: ["employee_id", "date"],
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("MealDeductions");
  },
};
