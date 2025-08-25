import db from "../../../../models";
import {
  generatePDF,
  generateCheckinsHTML,
  generatePrintableHTML,
} from "../../../../lib/pdfGenerator";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { format = "csv", startDate, endDate } = req.query;

    // Build where clause for date filtering
    let whereClause = {};
    if (startDate && endDate) {
      whereClause = {
        created_at: {
          [db.Sequelize.Op.between]: [
            new Date(startDate),
            new Date(endDate + "T23:59:59"),
          ],
        },
      };
    }

    const checkins = await db.VisitLog.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
    });

    console.log(`Found ${checkins.length} check-ins for date range: ${startDate} to ${endDate}`);

    // Get all unique employee IDs from the checkins
    const employeeIds = [
      ...new Set(
        checkins
          .filter((visitLog) => !visitLog.employee_id.startsWith("CONTRACTOR_"))
          .map((visitLog) => visitLog.employee_id)
      ),
    ];

    // Fetch employee data for all employee IDs at once
    const employees = await db.Employee.findAll({
      where: {
        employee_id: {
          [db.Sequelize.Op.in]: employeeIds,
        },
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

    const csvData = checkins.map((checkin) => {
      let employeeName = "N/A";
      let department = "N/A";
      let nationality = "N/A";

      if (checkin.employee_id.startsWith("CONTRACTOR_")) {
        // This is a contractor
        employeeName = checkin.username || "N/A";
      } else {
        // This is an employee
        const employee = employeeMap[checkin.employee_id];
        if (employee) {
          employeeName =
            `${employee.firstname || ""} ${employee.lastname || ""}`.trim() ||
            "N/A";
          department = employee.department || "N/A";
          nationality = employee.nationality || "N/A";
        } else {
          employeeName = checkin.username || "N/A";
        }
      }

      return {
        "Employee ID": checkin.employee_id,
        "Employee Name": employeeName,
        Department: department,
        Nationality: nationality,
        "Check-in Time": checkin.created_at,
        Username: checkin.username || "N/A",
      };
    });

    if (format === "pdf") {
      try {
        console.log("Starting PDF generation for checkins...");
        console.log("Data length:", csvData.length);

        // Try Puppeteer first
        const htmlContent = generateCheckinsHTML(csvData, "Check-ins Report");
        console.log("HTML generated, length:", htmlContent.length);

        try {
          const pdfBuffer = await generatePDF(htmlContent);
          console.log(
            "PDF generated successfully with Puppeteer, buffer size:",
            pdfBuffer.length
          );

          // Set headers for PDF download
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="checkins-${
              new Date().toISOString().split("T")[0]
            }.pdf"`
          );

          return res.status(200).send(pdfBuffer);
        } catch (puppeteerError) {
          console.log(
            "Puppeteer failed, falling back to HTML method:",
            puppeteerError.message
          );

          // Fallback: Generate printable HTML
          const printableHTML = generatePrintableHTML(
            htmlContent,
            "Check-ins Report"
          );

          // Set headers for HTML download
          res.setHeader("Content-Type", "text/html");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="checkins-${
              new Date().toISOString().split("T")[0]
            }.html"`
          );

          return res.status(200).send(printableHTML);
        }
      } catch (pdfError) {
        console.error("PDF generation error:", pdfError);
        console.error("PDF error stack:", pdfError.stack);
        return res.status(500).json({
          message: "PDF generation failed",
          error: pdfError.message,
          details: "Check server logs for more information",
        });
      }
    } else {
      // Default CSV format
      // Set headers for CSV download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="checkins-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );

      // Convert to CSV
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(","),
        ...csvData.map((row) =>
          headers.map((header) => `"${row[header] || ""}"`).join(",")
        ),
      ].join("\n");

      return res.status(200).send(csvContent);
    }
  } catch (error) {
    console.error("Error exporting checkins:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
