import { Parser } from "json2csv";
import * as XLSX from "xlsx";
import db from "../../../../models";
import ExcelJS from "exceljs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Accept both formats: filters object or direct properties
    let startDate, endDate, department, format, reportType, entityType;
    if (req.body.filters) {
      ({ startDate, endDate, department, entityType } = req.body.filters);
      format = req.body.format;
      reportType = req.body.reportType;
    } else {
      ({ startDate, endDate, department, format, reportType, entityType } =
        req.body);
    }

    // Handle date filtering - make it optional with fallback to recent data
    let whereClause = {};
    if (startDate && endDate) {
      whereClause = {
        checkin_time: {
          [db.Sequelize.Op.between]: [
            new Date(startDate),
            new Date(endDate + "T23:59:59"),
          ],
        },
      };
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      whereClause = {
        checkin_time: {
          [db.Sequelize.Op.gte]: thirtyDaysAgo,
        },
      };
    }

    // Add entityType filter to where clause
    if (entityType === "employee") {
      whereClause.employee_id = {
        [db.Sequelize.Op.notLike]: "CONTRACTOR_%",
      };
    } else if (entityType === "contractor") {
      whereClause.employee_id = {
        [db.Sequelize.Op.like]: "CONTRACTOR_%",
      };
    }

    let reportData;

    // Only support daily report
    if (reportType === "daily") {
      reportData = await generateDailyReport(whereClause, department);
    } else {
      return res.status(400).json({ message: "Invalid report type" });
    }

    if (format === "csv") {
      return generateCSV(reportData, res);
    } else if (format === "xlsx") {
      return generateExcel(reportData, res);
    } else {
      return res.status(400).json({ message: "Invalid format" });
    }
  } catch (error) {
    console.error("Error generating report download:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function generateDailyReport(whereClause, department) {
  const visits = await db.VisitLog.findAll({
    where: whereClause,
    order: [["created_at", "DESC"]],
  });

  // Get all unique employee IDs from the visits
  const employeeIds = [
    ...new Set(
      visits
        .filter((visit) => !visit.employee_id.startsWith("CONTRACTOR_"))
        .map((visit) => visit.employee_id)
    ),
  ];

  // Fetch employee data for all employee IDs at once
  const employees = await db.Employee.findAll({
    where: {
      employee_id: {
        [db.Sequelize.Op.in]: employeeIds,
      },
      ...(department && department !== "all" ? { department } : {}),
    },
    attributes: ["firstname", "lastname", "employee_id", "department"],
  });

  // Create a map for quick employee lookup
  const employeeMap = employees.reduce((map, employee) => {
    map[employee.employee_id] = employee;
    return map;
  }, {});

  // Filter visits based on department if specified
  const filteredVisits =
    department && department !== "all"
      ? visits.filter((visit) => {
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
      "ID",
      "Name",
      "Type",
      "Department",
      "Check-in Time",
      "Source Type",
      "Guests",
    ],
    data: filteredVisits.map((visit) => {
      // Handle both employees and contractors
      let name = "N/A";
      let department = "N/A";
      let entityType = "Employee";
      let id = visit.employee_id;

      if (visit.employee_id.startsWith("CONTRACTOR_")) {
        // This is a contractor
        entityType = "Contractor";
        name = visit.username || "N/A";
        id = visit.employee_id.replace("CONTRACTOR_", "C-");
      } else {
        // This is an employee
        const employee = employeeMap[visit.employee_id];
        if (employee) {
          name =
            `${employee.firstname || ""} ${employee.lastname || ""}`.trim() ||
            "N/A";
          department = employee.department || "N/A";
        } else {
          name = visit.username || "N/A";
        }
      }

      return {
        Date: new Date(visit.checkin_time).toLocaleDateString(),
        ID: id,
        Name: name,
        Type: entityType,
        Department: department,
        "Check-in Time": new Date(visit.checkin_time).toLocaleTimeString(),
        "Source Type": visit.source_type || "N/A",
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
          .filter((v) => !v.employee_id.startsWith("CONTRACTOR_"))
          .map((v) => v.employee_id)
      ).size,
    },
  };
}

async function generateNationalityReport(whereClause, department) {
  const visits = await db.VisitLog.findAll({
    where: whereClause,
  });

  // Get all unique employee IDs from the visits
  const employeeIds = [
    ...new Set(
      visits
        .filter((visit) => !visit.employee_id.startsWith("CONTRACTOR_"))
        .map((visit) => visit.employee_id)
    ),
  ];

  // Fetch employee data for all employee IDs at once
  const employees = await db.Employee.findAll({
    where: {
      employee_id: {
        [db.Sequelize.Op.in]: employeeIds,
      },
      ...(department && department !== "all" ? { department } : {}),
    },
    attributes: [
      "firstname",
      "lastname",
      "employee_id",
      "department",
      "nationality",
    ],
  });

  // Create a map for quick employee lookup
  const employeeMap = employees.reduce((map, employee) => {
    map[employee.employee_id] = employee;
    return map;
  }, {});

  const nationalitySummary = visits.reduce((acc, visit) => {
    if (visit.employee_id.startsWith("CONTRACTOR_")) {
      // Contractors don't have nationality
      const nationality = "Contractor";
      if (!acc[nationality]) {
        acc[nationality] = 0;
      }
      acc[nationality]++;
    } else {
      const employee = employeeMap[visit.employee_id];
      if (employee) {
        const nationality = employee.nationality || "Unknown";
        if (!acc[nationality]) {
          acc[nationality] = 0;
        }
        acc[nationality]++;
      }
    }
    return acc;
  }, {});

  return {
    title: "Nationality-wise Summary",
    columns: ["Nationality", "Total Visits", "Percentage"],
    data: Object.entries(nationalitySummary).map(([nationality, count]) => ({
      Nationality: nationality,
      "Total Visits": count,
      Percentage: `${((count / visits.length) * 100).toFixed(1)}%`,
    })),
  };
}

async function generateTopVisitorsReport(whereClause, department) {
  const visits = await db.VisitLog.findAll({
    where: whereClause,
  });

  // Get all unique employee IDs from the visits
  const employeeIds = [
    ...new Set(
      visits
        .filter((visit) => !visit.employee_id.startsWith("CONTRACTOR_"))
        .map((visit) => visit.employee_id)
    ),
  ];

  // Fetch employee data for all employee IDs at once
  const employees = await db.Employee.findAll({
    where: {
      employee_id: {
        [db.Sequelize.Op.in]: employeeIds,
      },
      ...(department && department !== "all" ? { department } : {}),
    },
    attributes: ["firstname", "lastname", "employee_id", "department"],
  });

  // Create a map for quick employee lookup
  const employeeMap = employees.reduce((map, employee) => {
    map[employee.employee_id] = employee;
    return map;
  }, {});

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
            department: "N/A",
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

  const sortedVisits = Object.values(employeeVisits)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

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
  };
}

function generateCSV(reportData, res) {
  const parser = new Parser({
    fields: reportData.columns,
  });

  const csv = parser.parse(reportData.data);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${reportData.title
      .toLowerCase()
      .replace(/\s+/g, "-")}.csv"`
  );

  return res.status(200).send(csv);
}

async function generateExcel(reportData, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportData.title);

  // Add headers
  worksheet.columns = reportData.columns.map((column) => ({
    header: column,
    key: column,
    width: 20,
  }));

  // Add rows
  worksheet.addRows(reportData.data);

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${reportData.title
      .toLowerCase()
      .replace(/\s+/g, "-")}.xlsx"`
  );

  await workbook.xlsx.write(res);
  return res.status(200).end();
}
