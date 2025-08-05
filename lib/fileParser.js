import { parse } from "csv-parse";
import XLSX from "xlsx";

export async function parseFile(fileBuffer, fileType) {
  try {
    // Remove BOM if present
    let buffer = fileBuffer;
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      buffer = buffer.slice(3);
    }
    // Log the raw buffer as a string for debugging
    const rawString = buffer.toString("utf8");
    console.log("Bulk upload debug: raw file string:\n", rawString);

    let records = [];
    let headers = [];

    if (fileType === "csv") {
      // Try comma, then semicolon, then tab
      records = await new Promise((resolve, reject) => {
        parse(
          buffer,
          {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_quotes: true,
            relax_column_count: true,
          },
          (err, recs) => {
            if (err) reject(err);
            else resolve(recs);
          }
        );
      });

      if (records.length === 0) {
        // Try semicolon
        records = await new Promise((resolve, reject) => {
          parse(
            rawString,
            {
              columns: true,
              skip_empty_lines: true,
              trim: true,
              delimiter: ";",
            },
            (err, recs) => {
              if (err) reject(err);
              else resolve(recs);
            }
          );
        });
      }

      if (records.length === 0) {
        // Try tab
        records = await new Promise((resolve, reject) => {
          parse(
            rawString,
            {
              columns: true,
              skip_empty_lines: true,
              trim: true,
              delimiter: "\t",
            },
            (err, recs) => {
              if (err) reject(err);
              else resolve(recs);
            }
          );
        });
      }

      // Get headers from the first record
      if (records.length > 0) {
        headers = Object.keys(records[0]);
      }
    } else if (fileType === "xlsx") {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      records = XLSX.utils.sheet_to_json(worksheet);

      // Get headers from the worksheet
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      headers = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = worksheet[cellAddress];
        if (cell) {
          headers.push(cell.v);
        }
      }
    } else {
      throw new Error("Unsupported file type");
    }

    // Validate headers
    if (headers.length > 0) {
      const headerValidation = validateHeaders(headers);
      if (!headerValidation.isValid) {
        throw new Error(headerValidation.errors.join(", "));
      }
    }

    return records;
  } catch (error) {
    console.error("Error parsing file:", error);
    throw new Error(error.message || "Failed to parse file");
  }
}

export function validateHeaders(headers) {
  const expectedHeaders = [
    "firstname",
    "lastname",
    "employee_id",
    "email",
    "department",
    "nationality",
  ];

  const allowedVariations = {
    firstname: ["firstname", "FirstName", "First Name", "first_name"],
    lastname: ["lastname", "LastName", "Last Name", "last_name"],
    employee_id: ["employee_id", "EmployeeID", "Employee ID", "employeeid"],
    email: ["email", "Email"],
    department: ["department", "Department"],
    nationality: ["nationality", "Nationality"],
  };

  const missingHeaders = [];
  const foundHeaders = {};

  // Check if we have at least the required headers
  const requiredHeaders = ["firstname", "lastname", "employee_id", "email"];

  for (const required of requiredHeaders) {
    const found = headers.some((header) =>
      allowedVariations[required].some(
        (variation) =>
          header.toLowerCase().trim() === variation.toLowerCase().trim()
      )
    );

    if (!found) {
      missingHeaders.push(required);
    }
  }

  if (missingHeaders.length > 0) {
    return {
      isValid: false,
      errors: [
        `Missing required headers: ${missingHeaders.join(
          ", "
        )}. Expected headers: ${requiredHeaders.join(", ")}`,
      ],
    };
  }

  return { isValid: true, errors: [] };
}

export function validateRecords(records) {
  const errors = [];
  const requiredFields = ["firstname", "lastname", "employee_id", "email"];

  records.forEach((record, index) => {
    requiredFields.forEach((field) => {
      if (!record[field] || record[field].toString().trim() === "") {
        errors.push(`Row ${index + 1}: Missing required field "${field}"`);
      }
    });

    if (record.email && !isValidEmail(record.email)) {
      errors.push(`Row ${index + 1}: Invalid email format`);
    }
  });

  return errors;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
