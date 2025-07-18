'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('VisitLogs', 'guest_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of guests accompanying the employee'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('VisitLogs', 'guest_count');
  }
};
