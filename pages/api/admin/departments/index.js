import db from "../../../../models";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const departments = await db.Employee.findAll({
      attributes: ["department"],
      where: {
        department: {
          [db.Sequelize.Op.not]: null,
          [db.Sequelize.Op.ne]: "",
        },
      },
      group: ["department"],
      order: [["department", "ASC"]],
    });

    const uniqueDepartments = departments
      .map((dept) => dept.department)
      .filter((dept) => dept && dept.trim() !== "");

    return res.status(200).json(uniqueDepartments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
