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

    // Create where clause for the Employee include
    const employeeWhereClause = {};

    // Add department filter if specified and not 'all'
    if (department && department !== "all") {
      employeeWhereClause.department = department;
    }

    // Add entityType filter
    let entityTypeFilter = null;
    if (entityType === "employee") {
      entityTypeFilter = "employee";
    } else if (entityType === "contractor") {
      entityTypeFilter = "contractor";
    }

    let reportData;

    // Only support daily report
    if (reportType === "daily") {
      reportData = await generateDailyReport(
        whereClause,
        employeeWhereClause,
        entityTypeFilter
      );
    } else {
      return res.status(400).json({ message: "Invalid report type" });
    }

    return res.status(200).json(reportData);
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function generateDailyReport(
  whereClause,
  employeeWhereClause,
  entityTypeFilter
) {
  const visits = await db.VisitLog.findAll({
    where: whereClause,
    include: [
      {
        model: db.Employee,
        attributes: ["firstname", "lastname", "employee_id", "department"],
        where: employeeWhereClause,
      },
    ],
    order: [["checkin_time", "DESC"]],
  });

  // Filter by entityType if needed
  const filteredVisits = entityTypeFilter
    ? visits.filter((visit) => {
        if (entityTypeFilter === "employee") {
          return !visit.employee_id.startsWith("CONTRACTOR_");
        } else if (entityTypeFilter === "contractor") {
          return visit.employee_id.startsWith("CONTRACTOR_");
        }
        return true;
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
    data: filteredVisits.map((visit) => ({
      Date: new Date(visit.checkin_time).toLocaleDateString(),
      "Employee ID": visit.Employee.employee_id,
      Name: `${visit.Employee.firstname} ${visit.Employee.lastname}`,
      Department: visit.Employee.department,
      "Check-in Time": new Date(visit.checkin_time).toLocaleTimeString(),
      Guests: visit.guest_count || 0,
    })),
    summary: {
      totalGuests,
      employeeCheckins,
      contractorCheckins,
      totalVisits: filteredVisits.length,
      uniqueEmployees: new Set(
        filteredVisits.map((v) => v.Employee.employee_id)
      ).size,
    },
  };
}

async function generateTopVisitorsReport(whereClause, employeeWhereClause) {
  const visits = await db.VisitLog.findAll({
    where: whereClause,
    include: [
      {
        model: db.Employee,
        attributes: ["firstname", "lastname", "employee_id", "department"],
        where: employeeWhereClause,
      },
    ],
  });

  // Count visits per employee
  const employeeVisits = visits.reduce((acc, visit) => {
    const key = visit.Employee.employee_id;
    if (!acc[key]) {
      acc[key] = {
        count: 0,
        employee: visit.Employee,
      };
    }
    acc[key].count++;
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
