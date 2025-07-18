import db from "../../models";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    await db.sequelize.authenticate();
    const employees = await db.Employee.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { firstname: { [db.Sequelize.Op.iLike]: `%${query}%` } },
          { lastname: { [db.Sequelize.Op.iLike]: `%${query}%` } },
          { employee_id: { [db.Sequelize.Op.iLike]: `%${query}%` } },
        ],
      },
      attributes: [
        "id",
        "firstname",
        "lastname",
        "employee_id",
        "department",
        "email",
        "qr_code_data",
      ],
    });
    const contractors = await db.Contractor.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { company_name: { [db.Sequelize.Op.iLike]: `%${query}%` } },
          { contact_person: { [db.Sequelize.Op.iLike]: `%${query}%` } },
          { contact_email: { [db.Sequelize.Op.iLike]: `%${query}%` } },
        ],
        is_active: true,
      },
      attributes: [
        "id",
        "company_name",
        "contact_person",
        "contact_email",
        "qr_code_data",
      ],
    });
    // Add type field to each result
    const employeeResults = employees.map((e) => ({
      ...e.toJSON(),
      type: "employee",
    }));
    const contractorResults = contractors.map((c) => ({
      ...c.toJSON(),
      type: "contractor",
    }));
    return res.status(200).json([...employeeResults, ...contractorResults]);
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ error: "Failed to search" });
  }
}
