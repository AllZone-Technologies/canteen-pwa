import { parseFile, validateRecords } from "../../../../lib/fileParser";
import db from "../../../../models";
import { generateQRCode } from "../../../../lib/qrCode";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Get file type from content-type header
    const contentType = req.headers["content-type"];
    const fileType = contentType.includes("excel") ? "xlsx" : "csv";

    // Parse file
    const records = parseFile(buffer, fileType);

    // Validate records
    const errors = validateRecords(records);
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation errors found",
        errors,
      });
    }

    // Process records
    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        // Check if employee_id already exists
        const existingEmployee = await db.Employee.findOne({
          where: { employee_id: record.employee_id },
        });

        if (existingEmployee) {
          results.errors.push({
            employee_id: record.employee_id,
            error: "Employee ID already exists",
          });
          continue;
        }

        // Generate QR code
        const qrCodeData = await generateQRCode(record.employee_id);

        // Create employee
        const employee = await db.Employee.create({
          ...record,
          qr_code_data: qrCodeData,
        });

        results.success.push({
          id: employee.id,
          firstname: employee.firstname,
          lastname: employee.lastname,
          employee_id: employee.employee_id,
          email: employee.email,
          department: employee.department,
        });
      } catch (error) {
        results.errors.push({
          employee_id: record.employee_id,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      message: `Successfully processed ${results.success.length} records`,
      uploaded: results.success.length,
      failed: results.errors.length,
      users: results.success,
      errors: results.errors,
    });
  } catch (error) {
    console.error("Error processing bulk upload:", error);
    return res.status(500).json({
      message: "Failed to process bulk upload",
      error: error.message,
    });
  }
}
