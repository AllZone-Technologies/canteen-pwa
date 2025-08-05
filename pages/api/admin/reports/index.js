import db from "../../../../models";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { reportType, filters } = req.body;
    const { startDate, endDate, department, entityType } = filters;

    // Validate dates
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    // Base where clause for date range
    const whereClause = {
      checkin_time: {
        [db.Sequelize.Op.between]: [
          new Date(startDate),
          new Date(endDate + "T23:59:59"),
        ],
      },
    };

    // Add entityType filter to where clause
    if (entityType === "employee") {
      whereClause.employee_id = {
        [db.Sequelize.Op.notLike]: "CONTRACTOR_%"
      };
    } else if (entityType === "contractor") {
      whereClause.employee_id = {
        [db.Sequelize.Op.like]: "CONTRACTOR_%"
      };
    }

    let reportData;

    // Only support daily report
    if (reportType === "daily") {
      reportData = await generateDailyReport(whereClause, department);
    } else {
      return res.status(400).json({ message: "Invalid report type" });
    }

    return res.status(200).json(reportData);
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function generateDailyReport(whereClause, department) {
  const visits = await db.VisitLog.findAll({
    where: whereClause,
    order: [["checkin_time", "DESC"]],
  });

  // Get all unique employee IDs from the visits
  const employeeIds = [...new Set(
    visits
      .filter(visit => !visit.employee_id.startsWith("CONTRACTOR_"))
      .map(visit => visit.employee_id)
  )];

  // Fetch employee data for all employee IDs at once
  const employees = await db.Employee.findAll({
    where: {
      employee_id: {
        [db.Sequelize.Op.in]: employeeIds
      },
      ...(department && department !== "all" ? { department } : {})
    },
    attributes: ["firstname", "lastname", "employee_id", "department"],
  });

  // Create a map for quick employee lookup
  const employeeMap = employees.reduce((map, employee) => {
    map[employee.employee_id] = employee;
    return map;
  }, {});

  // Filter visits based on department if specified
  const filteredVisits = department && department !== "all" 
    ? visits.filter(visit => {
        if (visit.employee_id.startsWith("CONTRACTOR_")) {
          return false; // Contractors don't have departments
        }
        const employee = employeeMap[visit.employee_id];
        return employee && employee.department === department;
      })
    : visits;

  // Calculate summary values
  let totalGuests = 0;
  let employeeCheckins = 0;
  let contractorCheckins = 0;
  filteredVisits.forEach((visit) => {
    totalGuests += visit.guest_count || 0;
    if (visit.employee_id && visit.employee_id.startsWith("CONTRACTOR_")) {
      contractorCheckins++;
    } else {
      employeeCheckins++;
    }
  });

  return {
    title: "Daily Check-in Report",
    columns: [
      "Date",
      "Employee ID",
      "Name",
      "Department",
      "Check-in Time",
      "Guests",
    ],
    data: filteredVisits.map((visit) => {
      let name = "N/A";
      let employeeDepartment = "N/A";
      let employeeId = visit.employee_id;

      if (visit.employee_id.startsWith("CONTRACTOR_")) {
        // This is a contractor
        name = visit.username || "N/A";
        employeeId = visit.employee_id;
      } else {
        // This is an employee
        const employee = employeeMap[visit.employee_id];
        if (employee) {
          name = `${employee.firstname} ${employee.lastname}`;
          employeeDepartment = employee.department || "N/A";
          employeeId = employee.employee_id;
        } else {
          name = visit.username || "N/A";
        }
      }

      return {
        Date: new Date(visit.checkin_time).toLocaleDateString(),
        "Employee ID": employeeId,
        Name: name,
        Department: employeeDepartment,
        "Check-in Time": new Date(visit.checkin_time).toLocaleTimeString(),
        Guests: visit.guest_count || 0,
      };
    }),
    summary: {
      totalGuests,
      employeeCheckins,
      contractorCheckins,
      totalVisits: filteredVisits.length,
      uniqueEmployees: new Set(
        filteredVisits
          .filter(v => !v.employee_id.startsWith("CONTRACTOR_"))
          .map(v => v.employee_id)
      ).size,
    },
  };
}

async function generateTopVisitorsReport(whereClause, department) {
  const visits = await db.VisitLog.findAll({
    where: whereClause,
  });

  // Get all unique employee IDs from the visits
  const employeeIds = [...new Set(
    visits
      .filter(visit => !visit.employee_id.startsWith("CONTRACTOR_"))
      .map(visit => visit.employee_id)
  )];

  // Fetch employee data for all employee IDs at once
  const employees = await db.Employee.findAll({
    where: {
      employee_id: {
        [db.Sequelize.Op.in]: employeeIds
      },
      ...(department && department !== "all" ? { department } : {})
    },
    attributes: ["firstname", "lastname", "employee_id", "department"],
  });

  // Create a map for quick employee lookup
  const employeeMap = employees.reduce((map, employee) => {
    map[employee.employee_id] = employee;
    return map;
  }, {});

  // Count visits per employee
  const employeeVisits = visits.reduce((acc, visit) => {
    if (visit.employee_id.startsWith("CONTRACTOR_")) {
      // Handle contractors
      const key = visit.employee_id;
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          employee: {
            employee_id: visit.employee_id,
            firstname: visit.username || "Contractor",
            lastname: "",
            department: "N/A"
          },
        };
      }
      acc[key].count++;
    } else {
      // Handle employees
      const employee = employeeMap[visit.employee_id];
      if (employee) {
        const key = employee.employee_id;
        if (!acc[key]) {
          acc[key] = {
            count: 0,
            employee: employee,
          };
        }
        acc[key].count++;
      }
    }
    return acc;
  }, {});

  // Convert to array and sort by visit count
  const sortedVisits = Object.values(employeeVisits)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 visitors

  return {
    title: "Top Visitors Report",
    columns: ["Rank", "Employee ID", "Name", "Department", "Visit Count"],
    data: sortedVisits.map((visit, index) => ({
      Rank: index + 1,
      "Employee ID": visit.employee.employee_id,
      Name: `${visit.employee.firstname} ${visit.employee.lastname}`,
      Department: visit.employee.department,
      "Visit Count": visit.count,
    })),
    summary: {
      totalVisits: visits.length,
      uniqueEmployees: Object.keys(employeeVisits).length,
    },
  };
}
