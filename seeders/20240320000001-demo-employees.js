"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const employees = [
      {
        firstname: "John",
        lastname: "Doe",
        employee_id: "EMP001",
        email: "john.doe@example.com",
        department: "Engineering",
        nationality: "American",
        qr_code_data: "EMP001",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        firstname: "Jane",
        lastname: "Smith",
        employee_id: "EMP002",
        email: "jane.smith@example.com",
        department: "Marketing",
        nationality: "Canadian",
        qr_code_data: "EMP002",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        firstname: "Mike",
        lastname: "Johnson",
        employee_id: "EMP003",
        email: "mike.johnson@example.com",
        department: "Sales",
        nationality: "British",
        qr_code_data: "EMP003",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        firstname: "Sarah",
        lastname: "Williams",
        employee_id: "EMP004",
        email: "sarah.williams@example.com",
        department: "HR",
        nationality: "Australian",
        qr_code_data: "EMP004",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        firstname: "David",
        lastname: "Brown",
        employee_id: "EMP005",
        email: "david.brown@example.com",
        department: "Finance",
        nationality: "American",
        qr_code_data: "EMP005",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("Employees", employees, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Employees", null, {});
  },
};
