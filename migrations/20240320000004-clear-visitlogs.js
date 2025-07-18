"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("VisitLogs", null, {});
  },

  down: async (queryInterface, Sequelize) => {
    // No down migration needed as we're just clearing data
  },
};
