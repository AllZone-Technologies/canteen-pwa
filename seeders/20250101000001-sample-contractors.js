"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const contractors = [
      {
        company_name: "Tech Solutions Inc.",
        contact_person: "John Smith",
        contact_email: "john.smith@techsolutions.com",
        contact_phone: "+1-555-0123",
        qr_code_data: "CONTRACTOR_TECH_SOLUTIONS_001",
        is_active: true,
        notes: "IT consulting and development services",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        company_name: "Maintenance Pro Services",
        contact_person: "Sarah Johnson",
        contact_email: "sarah.johnson@maintenancepro.com",
        contact_phone: "+1-555-0456",
        qr_code_data: "CONTRACTOR_MAINTENANCE_PRO_002",
        is_active: true,
        notes: "Building maintenance and repair services",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        company_name: "Security Systems Ltd.",
        contact_person: "Mike Davis",
        contact_email: "mike.davis@securitysystems.com",
        contact_phone: "+1-555-0789",
        qr_code_data: "CONTRACTOR_SECURITY_SYSTEMS_003",
        is_active: true,
        notes: "Security system installation and monitoring",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        company_name: "Catering Express",
        contact_person: "Lisa Wilson",
        contact_email: "lisa.wilson@cateringexpress.com",
        contact_phone: "+1-555-0321",
        qr_code_data: "CONTRACTOR_CATERING_EXPRESS_004",
        is_active: true,
        notes: "Event catering and food services",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        company_name: "Cleaning Services Plus",
        contact_person: "Robert Brown",
        contact_email: "robert.brown@cleaningservices.com",
        contact_phone: "+1-555-0654",
        qr_code_data: "CONTRACTOR_CLEANING_SERVICES_005",
        is_active: false,
        notes: "Professional cleaning services (currently inactive)",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("Contractors", contractors, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Contractors", null, {});
  },
};
