import db from "../../../../models";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause = {
        [db.Sequelize.Op.or]: [
          { employee_id: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        ],
      };
    }

    const checkins = await db.VisitLog.findAndCountAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Get all unique employee IDs from the checkins
    const employeeIds = [...new Set(
      checkins.rows
        .filter(visitLog => !visitLog.employee_id.startsWith("CONTRACTOR_"))
        .map(visitLog => visitLog.employee_id)
    )];

    // Fetch employee data for all employee IDs at once
    const employees = await db.Employee.findAll({
      where: {
        employee_id: {
          [db.Sequelize.Op.in]: employeeIds
        }
      },
      attributes: ["firstname", "lastname", "employee_id", "department", "nationality"],
    });

    // Create a map for quick employee lookup
    const employeeMap = employees.reduce((map, employee) => {
      map[employee.employee_id] = employee;
      return map;
    }, {});

    const formattedCheckins = checkins.rows.map((visitLog) => {
      // Handle both employees and contractors
      let name = "N/A";
      let department = "N/A";
      let entityType = "Employee";

      if (visitLog.employee_id.startsWith("CONTRACTOR_")) {
        // This is a contractor
        entityType = "Contractor";
        name = visitLog.username || "N/A";
        // For contractors, we don't have department in the current structure
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

    return res.status(200).json({
      checkins: formattedCheckins,
      total: checkins.count,
      totalPages: Math.ceil(checkins.count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching checkins:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
