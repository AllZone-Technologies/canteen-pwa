const db = require("../models");

async function debugDatabaseRelations() {
  try {
    console.log("Debugging database relationships...\n");

    // Check VisitLog data
    console.log("1. VisitLog data:");
    const visitLogs = await db.VisitLog.findAll({
      limit: 5,
      order: [["created_at", "DESC"]],
    });

    console.log(`   - Total VisitLogs: ${visitLogs.length}`);
    visitLogs.forEach((log, i) => {
      console.log(
        `   ${i + 1}. ID: ${log.id}, Employee ID: "${
          log.employee_id
        }", Username: "${log.username}", Check-in: ${log.checkin_time}`
      );
    });

    // Check Employee data
    console.log("\n2. Employee data:");
    const employees = await db.Employee.findAll({
      limit: 5,
      order: [["created_at", "DESC"]],
    });

    console.log(`   - Total Employees: ${employees.length}`);
    employees.forEach((emp, i) => {
      console.log(
        `   ${i + 1}. Employee ID: "${emp.employee_id}", Name: "${
          emp.firstname
        } ${emp.lastname}"`
      );
    });

    // Test the association
    console.log("\n3. Testing VisitLog with Employee association:");
    const visitLogWithEmployee = await db.VisitLog.findOne({
      include: [
        {
          model: db.Employee,
          attributes: [
            "firstname",
            "lastname",
            "employee_id",
            "department",
            "nationality",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    if (visitLogWithEmployee) {
      console.log("   - Found VisitLog with Employee association!");
      console.log(`   - VisitLog ID: ${visitLogWithEmployee.id}`);
      console.log(`   - Employee ID: "${visitLogWithEmployee.employee_id}"`);
      console.log(
        `   - Employee: ${
          visitLogWithEmployee.Employee
            ? `${visitLogWithEmployee.Employee.firstname} ${visitLogWithEmployee.Employee.lastname}`
            : "N/A"
        }`
      );
    } else {
      console.log("   - No VisitLog with Employee association found");
    }

    // Test without association
    console.log("\n4. Testing VisitLog without association:");
    const visitLogWithoutEmployee = await db.VisitLog.findOne({
      order: [["created_at", "DESC"]],
    });

    if (visitLogWithoutEmployee) {
      console.log("   - Found VisitLog without association!");
      console.log(`   - VisitLog ID: ${visitLogWithoutEmployee.id}`);
      console.log(`   - Employee ID: "${visitLogWithoutEmployee.employee_id}"`);
      console.log(`   - Username: "${visitLogWithoutEmployee.username}"`);
    }
  } catch (error) {
    console.error("Debug failed:", error.message);
    console.error(error.stack);
  } finally {
    await db.sequelize.close();
  }
}

debugDatabaseRelations();
