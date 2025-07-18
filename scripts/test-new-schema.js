const db = require("../models");

async function testNewSchema() {
  try {
    console.log("Testing new Employee schema...");

    // Test creating a new employee with the new schema
    const testEmployee = await db.Employee.create({
      firstname: "John",
      lastname: "Doe",
      employee_id: "TEST001",
      email: "john.doe@test.com",
      department: "IT",
      nationality: "American",
      qr_code_data: "TEST001",
    });

    console.log("✅ Successfully created employee with new schema:");
    console.log("  - First Name:", testEmployee.firstname);
    console.log("  - Last Name:", testEmployee.lastname);
    console.log("  - Employee ID:", testEmployee.employee_id);
    console.log("  - Email:", testEmployee.email);
    console.log("  - Department:", testEmployee.department);
    console.log("  - Nationality:", testEmployee.nationality);
    console.log("  - QR Code Data:", testEmployee.qr_code_data);

    // Test finding the employee
    const foundEmployee = await db.Employee.findOne({
      where: { employee_id: "TEST001" },
    });

    if (foundEmployee) {
      console.log("✅ Successfully found employee with new schema");
    } else {
      console.log("❌ Failed to find employee");
    }

    // Test updating the employee
    await foundEmployee.update({
      nationality: "Canadian",
    });

    console.log(
      "✅ Successfully updated employee nationality to:",
      foundEmployee.nationality
    );

    // Test searching by firstname and lastname
    const searchResults = await db.Employee.findAll({
      where: {
        firstname: "John",
        lastname: "Doe",
      },
    });

    console.log(
      "✅ Successfully searched by firstname and lastname, found:",
      searchResults.length,
      "employees"
    );

    // Clean up - delete test employee
    await foundEmployee.destroy();
    console.log("✅ Successfully deleted test employee");

    console.log("\n🎉 All tests passed! The new schema is working correctly.");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error);
  } finally {
    await db.sequelize.close();
  }
}

testNewSchema();
