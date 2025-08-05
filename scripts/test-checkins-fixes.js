const db = require("../models");

async function testCheckinsFixes() {
  try {
    console.log("Testing checkins API fixes...\n");

    // Test 1: Check if we can fetch VisitLogs without association
    console.log("1. Testing VisitLog fetch without Employee association:");
    const visitLogs = await db.VisitLog.findAll({
      limit: 5,
      order: [["created_at", "DESC"]],
    });

    console.log(`   - Found ${visitLogs.length} visit logs`);

    if (visitLogs.length > 0) {
      // Test 2: Test the new approach of fetching employee data separately
      console.log("\n2. Testing employee data fetch approach:");

      // Get all unique employee IDs from the visit logs
      const employeeIds = [
        ...new Set(
          visitLogs
            .filter(
              (visitLog) => !visitLog.employee_id.startsWith("CONTRACTOR_")
            )
            .map((visitLog) => visitLog.employee_id)
        ),
      ];

      console.log(`   - Employee IDs found: ${employeeIds.join(", ")}`);

      if (employeeIds.length > 0) {
        // Fetch employee data for all employee IDs at once
        const employees = await db.Employee.findAll({
          where: {
            employee_id: {
              [db.Sequelize.Op.in]: employeeIds,
            },
          },
          attributes: ["firstname", "lastname", "employee_id", "department"],
        });

        console.log(`   - Found ${employees.length} matching employees`);

        // Create a map for quick employee lookup
        const employeeMap = employees.reduce((map, employee) => {
          map[employee.employee_id] = employee;
          return map;
        }, {});

        // Test 3: Format the data like the API does
        console.log("\n3. Testing data formatting:");
        const formattedCheckins = visitLogs.map((visitLog) => {
          let name = "N/A";
          let department = "N/A";
          let entityType = "Employee";

          if (visitLog.employee_id.startsWith("CONTRACTOR_")) {
            // This is a contractor
            entityType = "Contractor";
            name = visitLog.username || "N/A";
          } else {
            // This is an employee
            const employee = employeeMap[visitLog.employee_id];
            if (employee) {
              name =
                `${employee.firstname || ""} ${
                  employee.lastname || ""
                }`.trim() || "N/A";
              department = employee.department || "N/A";
            } else {
              name = visitLog.username || "N/A";
            }
          }

          return {
            id: visitLog.id,
            employee_id: visitLog.employee_id,
            name: name,
            department: department,
            entityType: entityType,
            checkin_time: visitLog.checkin_time || visitLog.created_at,
            source_type: visitLog.source_type || "N/A",
            guest_count: visitLog.guest_count || 0,
            username: visitLog.username,
          };
        });

        console.log("   - Successfully formatted checkins data:");
        formattedCheckins.forEach((checkin, i) => {
          console.log(
            `   ${i + 1}. ${checkin.name} (${checkin.entityType}) - ${
              checkin.department
            }`
          );
        });
      }
    }

    // Test 4: Test MealDeduction association (should still work)
    console.log("\n4. Testing MealDeduction association (should work):");
    const mealDeduction = await db.MealDeduction.findOne({
      include: [
        {
          model: db.Employee,
          as: "Employee",
          attributes: ["firstname", "lastname", "employee_id"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    if (mealDeduction) {
      console.log("   - MealDeduction association works correctly");
      console.log(
        `   - Employee: ${
          mealDeduction.Employee
            ? `${mealDeduction.Employee.firstname} ${mealDeduction.Employee.lastname}`
            : "N/A"
        }`
      );
    } else {
      console.log("   - No MealDeduction found to test");
    }

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  } finally {
    await db.sequelize.close();
  }
}

testCheckinsFixes();
