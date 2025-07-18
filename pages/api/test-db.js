import db from "../../models";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await db.sequelize.authenticate();
    console.log("Database connection successful");

    // Get all employees
    const employees = await db.Employee.findAll();
    console.log("Found employees count:", employees.length);

    // Return processed employee data
    const processedEmployees = employees.map((emp) => ({
      id: emp.id,
      firstname: emp.firstname,
      lastname: emp.lastname,
      employee_id: emp.employee_id,
      email: emp.email,
      department: emp.department,
      nationality: emp.nationality,
      qr_code_data: emp.qr_code_data,
    }));

    console.log(
      "Processed employees data:",
      JSON.stringify(processedEmployees, null, 2)
    );
    return res.status(200).json(processedEmployees);
  } catch (error) {
    console.error("Error in test-db API:", error);
    return res.status(500).json({ error: error.message });
  }
}
