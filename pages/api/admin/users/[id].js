import db from "../../../../models";

export default async function handler(req, res) {
  const { query, method } = req;
  const { id } = query;

  // GET method to fetch a single employee
  if (method === "GET") {
    try {
      const employee = await db.Employee.findByPk(id, {
        attributes: [
          // Include necessary attributes
          "id",
          "firstname",
          "lastname",
          "employee_id",
          "email",
          "department",
          "created_at",
          "qr_code_data",
        ],
      });

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      return res.status(200).json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // PUT method to update a single employee
  if (method === "PUT") {
    const { firstname, lastname, email, department } = req.body;

    try {
      const employee = await db.Employee.findByPk(id);

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Update employee fields
      employee.firstname = firstname || employee.firstname;
      employee.lastname = lastname || employee.lastname;
      employee.email = email || employee.email; // Consider validation
      employee.department = department || employee.department;

      await employee.save();

      return res
        .status(200)
        .json({ message: "Employee updated successfully", employee });
    } catch (error) {
      console.error("Error updating employee:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ message: "Email already exists." });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // DELETE method to delete a single employee
  if (method === "DELETE") {
    try {
      const employee = await db.Employee.findByPk(id);

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      await employee.destroy();

      return res.status(200).json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error("Error deleting employee:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Method not allowed
  res.status(405).json({ message: "Method not allowed" });
}
