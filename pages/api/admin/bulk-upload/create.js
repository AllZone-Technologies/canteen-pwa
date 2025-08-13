import db from "../../../../models";
import { parseFile, validateRecords } from "../../../../lib/fileParser";
import { generateQRCode } from "../../../../lib/qrCode";
import { sendQRCodeEmail } from "../../../../lib/email";

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
    // Debug: log headers
    console.log("Bulk upload create: headers", req.headers);

    let records;
    // Check if the request is JSON with records
    if (
      req.headers["content-type"] &&
      req.headers["content-type"].includes("application/json")
    ) {
      const body = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => {
          data += chunk;
        });
        req.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
        req.on("error", reject);
      });
      // Debug: log parsed body
      console.log("Bulk upload create: parsed body", body);
      records = body.records || [];
    } else {
      // Fallback: parse file upload
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      // Get file type from content-type header
      const contentType = req.headers["content-type"];
      const fileType =
        contentType && contentType.includes("excel") ? "xlsx" : "csv";
      records = await parseFile(buffer, fileType);
    }

    // Debug: log records
    console.log("Bulk upload create: records", records);

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "No records to create" });
    }

    // Transform records to match expected format
    const transformedRecords = records.map((record) => ({
      firstname:
        record.firstname || record.FirstName || record["First Name"] || "",
      lastname: record.lastname || record.LastName || record["Last Name"] || "",
      employee_id:
        record.employee_id || record.EmployeeID || record["Employee ID"] || "",
      email: record.email || record.Email || "",
      department: record.department || record.Department || "",
    }));

    // Debug: log transformed records
    console.log("Bulk upload create: transformed records", transformedRecords);

    // Validate records
    const errors = validateRecords(transformedRecords);
    // Debug: log validation errors
    console.log("Bulk upload create: validation errors", errors);
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

    for (const record of transformedRecords) {
      try {
        // Check if employee_id already exists
        const existingEmployeeById = await db.Employee.findOne({
          where: { employee_id: record.employee_id },
        });

        if (existingEmployeeById) {
          results.errors.push({
            row: transformedRecords.indexOf(record) + 1,
            employee_id: record.employee_id,
            email: record.email,
            error: "Employee ID already exists in the system",
          });
          continue;
        }

        // Check if email already exists
        const existingEmployeeByEmail = await db.Employee.findOne({
          where: { email: record.email },
        });

        if (existingEmployeeByEmail) {
          results.errors.push({
            row: transformedRecords.indexOf(record) + 1,
            employee_id: record.employee_id,
            email: record.email,
            error: "Email address already exists in the system",
          });
          continue;
        }

        // Generate QR code image for email (but store only employee_id in DB)
        const qrCodeImage = await generateQRCode(record.employee_id);

        // Create employee
        const employee = await db.Employee.create({
          ...record,
          qr_code_data: record.employee_id, // Store only the employee_id
        });

        // Send QR code email
        try {
          await sendQRCodeEmail({
            to: employee.email,
            employeeId: employee.employee_id,
            qrCodeDataUrl: qrCodeImage,
            employeeName: `${employee.firstname} ${employee.lastname}`,
          });
        } catch (emailError) {
          console.error(
            `Failed to send QR code email to ${employee.email}:`,
            emailError
          );
        }

        results.success.push({
          id: employee.id,
          firstname: employee.firstname,
          lastname: employee.lastname,
          employee_id: employee.employee_id,
          email: employee.email,
          department: employee.department,
          nationality: employee.nationality,
        });
      } catch (error) {
        // Handle database constraint errors gracefully
        let errorMessage = error.message;

        if (error.name === "SequelizeUniqueConstraintError") {
          const field = error.errors?.[0]?.path;
          if (field === "employee_id") {
            errorMessage = "Employee ID already exists in the system";
          } else if (field === "email") {
            errorMessage = "Email address already exists in the system";
          } else {
            errorMessage = `Duplicate value for field: ${field}`;
          }
        } else if (error.name === "SequelizeValidationError") {
          errorMessage = error.errors?.[0]?.message || "Validation error";
        }

        results.errors.push({
          row: transformedRecords.indexOf(record) + 1,
          employee_id: record.employee_id,
          email: record.email,
          error: errorMessage,
        });
      }
    }

    // Debug: log final results
    console.log("Bulk upload create: DB results", results);

    return res.status(200).json({
      message: `Successfully processed ${results.success.length} records`,
      count: results.success.length,
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
