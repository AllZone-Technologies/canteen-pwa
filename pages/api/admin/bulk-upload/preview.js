const formidable = require("formidable");
const fs = require("fs");
// Use dynamic import for ES module compatibility
let parseFile, validateRecords;
try {
  ({ parseFile, validateRecords } = await import(
    "../../../../lib/fileParser.js"
  ));
} catch (e) {
  console.error("Failed to import parseFile:", e);
}

// Import database models
let db;
try {
  db = await import("../../../../models/index.js");
} catch (e) {
  console.error("Failed to import database models:", e);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    try {
      console.log("Formidable fields:", fields);
      console.log("Formidable files:", files);

      const fileKey = Object.keys(files)[0];
      const fileArr = files[fileKey];
      const file = Array.isArray(fileArr) ? fileArr[0] : fileArr;
      if (!file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }
      const filePath = file.filepath || file.path;
      if (!filePath) {
        res.status(400).json({ message: "File path not found in upload" });
        return;
      }
      const buffer = await fs.promises.readFile(filePath);
      const fileType = file.originalFilename.endsWith(".xlsx") ? "xlsx" : "csv";
      const records = await parseFile(buffer, fileType);

      // Transform records to match expected format
      const transformedRecords = Array.isArray(records)
        ? records.map((record) => ({
            firstname:
              record.firstname ||
              record.FirstName ||
              record["First Name"] ||
              "",
            lastname:
              record.lastname || record.LastName || record["Last Name"] || "",
            employee_id:
              record.employee_id ||
              record.EmployeeID ||
              record["Employee ID"] ||
              "",
            email: record.email || record.Email || "",
            department: record.department || record.Department || "",
            nationality: record.nationality || record.Nationality || "",
          }))
        : [];

      // Validate the transformed records
      const validationErrors = validateRecords(transformedRecords);
      if (validationErrors.length > 0) {
        res.status(400).json({
          error: "Data validation failed",
          message: "Please fix the following errors in your file:",
          errors: validationErrors,
        });
        return;
      }

      // Check for duplicates in the database
      const warnings = [];

      // Check for duplicates within the file itself
      const seenEmployeeIds = new Set();
      const seenEmails = new Set();

      transformedRecords.forEach((record, index) => {
        if (seenEmployeeIds.has(record.employee_id)) {
          warnings.push({
            row: index + 1,
            type: "duplicate_employee_id",
            message: `Duplicate Employee ID within file: ${record.employee_id}`,
            employee_id: record.employee_id,
          });
        } else {
          seenEmployeeIds.add(record.employee_id);
        }

        if (seenEmails.has(record.email)) {
          warnings.push({
            row: index + 1,
            type: "duplicate_email",
            message: `Duplicate Email within file: ${record.email}`,
            email: record.email,
          });
        } else {
          seenEmails.add(record.email);
        }
      });

      // Check for existing records in database
      if (db && db.default) {
        try {
          // Get all unique employee IDs and emails from the file
          const employeeIds = [...seenEmployeeIds];
          const emails = [...seenEmails];

          // Check for existing employee IDs
          const existingEmployees = await db.default.Employee.findAll({
            where: {
              employee_id: employeeIds,
            },
            attributes: ["employee_id", "email"],
          });

          // Check for existing emails
          const existingEmails = await db.default.Employee.findAll({
            where: {
              email: emails,
            },
            attributes: ["employee_id", "email"],
          });

          // Create sets for quick lookup
          const existingEmployeeIds = new Set(
            existingEmployees.map((emp) => emp.employee_id)
          );
          const existingEmailsSet = new Set(
            existingEmails.map((emp) => emp.email)
          );

          // Add warnings for existing records
          transformedRecords.forEach((record, index) => {
            if (existingEmployeeIds.has(record.employee_id)) {
              warnings.push({
                row: index + 1,
                type: "existing_employee_id",
                message: `Employee ID already exists in database: ${record.employee_id}`,
                employee_id: record.employee_id,
              });
            }

            if (existingEmailsSet.has(record.email)) {
              warnings.push({
                row: index + 1,
                type: "existing_email",
                message: `Email already exists in database: ${record.email}`,
                email: record.email,
              });
            }
          });
        } catch (dbError) {
          console.error("Database check error:", dbError);
          // Continue without database warnings if there's an error
        }
      }

      res.status(200).json({
        records: transformedRecords,
        totalRecords: transformedRecords.length,
        fileName: file.originalFilename,
        warnings: warnings,
      });
    } catch (error) {
      console.error("Bulk upload preview error:", error);
      res.status(500).json({
        message: "Unexpected error",
        error: error.message,
        stack: error.stack,
      });
    }
  });
}
