"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("AdminUsers", "resetToken", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("AdminUsers", "resetTokenExpiry", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("AdminUsers", "resetToken");
    await queryInterface.removeColumn("AdminUsers", "resetTokenExpiry");
  },
};
