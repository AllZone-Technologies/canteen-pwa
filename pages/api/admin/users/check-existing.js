import db from "../../../../models";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { field, value } = req.query;

  if (!field || !value) {
    return res.status(400).json({
      message: "Field and value parameters are required",
    });
  }

  // Validate field parameter
  if (!["employee_id", "email"].includes(field)) {
    return res.status(400).json({
      message: "Field must be either 'employee_id' or 'email'",
    });
  }

  try {
    // Check if the value already exists
    const existingEmployee = await db.Employee.findOne({
      where: { [field]: value },
      attributes: ["id", field],
    });

    return res.status(200).json({
      exists: !!existingEmployee,
      field: field,
      value: value,
    });
  } catch (error) {
    console.error("Error checking existing value:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
