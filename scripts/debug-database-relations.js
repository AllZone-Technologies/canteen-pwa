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

    // Test the new approach without association
    console.log("\n3. Testing VisitLog data fetching without association:");
    const visitLogsForTest = await db.VisitLog.findAll({
      limit: 3,
      order: [["created_at", "DESC"]],
    });

    if (visitLogsForTest.length > 0) {
      console.log("   - Found VisitLogs without association!");
      
      // Get all unique employee IDs from the visit logs
      const employeeIds = [...new Set(
        visitLogsForTest
          .filter(visitLog => !visitLog.employee_id.startsWith("CONTRACTOR_"))
          .map(visitLog => visitLog.employee_id)
      )];

      console.log(`   - Employee IDs found: ${employeeIds.join(", ")}`);

      if (employeeIds.length > 0) {
        // Fetch employee data for all employee IDs at once
        const employeesForTest = await db.Employee.findAll({
          where: {
            employee_id: {
              [db.Sequelize.Op.in]: employeeIds
            }
          },
          attributes: ["firstname", "lastname", "employee_id", "department"],
        });

        console.log(`   - Found ${employeesForTest.length} matching employees`);

        // Create a map for quick employee lookup
        const employeeMap = employeesForTest.reduce((map, employee) => {
          map[employee.employee_id] = employee;
          return map;
        }, {});

        visitLogsForTest.forEach((visitLog, i) => {
          console.log(`   ${i + 1}. VisitLog ID: ${visitLog.id}`);
          console.log(`      - Employee ID: "${visitLog.employee_id}"`);
          console.log(`      - Username: "${visitLog.username}"`);
          
          if (visitLog.employee_id.startsWith("CONTRACTOR_")) {
            console.log(`      - Type: Contractor`);
            console.log(`      - Name: ${visitLog.username || "N/A"}`);
          } else {
            const employee = employeeMap[visitLog.employee_id];
            if (employee) {
              console.log(`      - Type: Employee`);
              console.log(`      - Name: ${employee.firstname} ${employee.lastname}`);
              console.log(`      - Department: ${employee.department || "N/A"}`);
            } else {
              console.log(`      - Type: Employee (not found in database)`);
              console.log(`      - Name: ${visitLog.username || "N/A"}`);
            }
          }
        });
      }
    } else {
      console.log("   - No VisitLogs found");
    }

    // Test MealDeduction association (this should still work)
    console.log("\n4. Testing MealDeduction with Employee association:");
    const mealDeductionWithEmployee = await db.MealDeduction.findOne({
      include: [
        {
          model: db.Employee,
          as: "Employee",
          attributes: ["firstname", "lastname", "employee_id"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    if (mealDeductionWithEmployee) {
      console.log("   - Found MealDeduction with Employee association!");
      console.log(`   - MealDeduction ID: ${mealDeductionWithEmployee.id}`);
      console.log(`   - Employee ID: "${mealDeductionWithEmployee.employee_id}"`);
      console.log(
        `   - Employee: ${
          mealDeductionWithEmployee.Employee
            ? `${mealDeductionWithEmployee.Employee.firstname} ${mealDeductionWithEmployee.Employee.lastname}`
            : "N/A"
        }`
      );
    } else {
      console.log("   - No MealDeduction with Employee association found");
    }

  } catch (error) {
    console.error("Debug failed:", error.message);
    console.error(error.stack);
  } finally {
    await db.sequelize.close();
  }
}

debugDatabaseRelations();
