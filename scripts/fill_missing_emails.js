const db = require("../models");

async function fillMissingEmails() {
  try {
    const employees = await db.Employee.findAll({
      where: { email: null },
    });

    for (const emp of employees) {
      // Use employee_id or id to generate a unique email
      const uniqueEmail = `employee${emp.id || emp.employee_id}@example.com`;
      emp.email = uniqueEmail;
      await emp.save();
      console.log(`Updated employee ${emp.id} with email: ${uniqueEmail}`);
    }

    console.log("All missing emails have been filled.");
    process.exit(0);
  } catch (err) {
    console.error("Error updating employees:", err);
    process.exit(1);
  }
}

fillMissingEmails();
