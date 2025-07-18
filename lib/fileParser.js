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

    if (fileType === "csv") {
      // Try comma, then semicolon, then tab
      let records = await new Promise((resolve, reject) => {
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
      return records;
    } else if (fileType === "xlsx") {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(worksheet);
    } else {
      throw new Error("Unsupported file type");
    }
  } catch (error) {
    console.error("Error parsing file:", error);
    throw new Error("Failed to parse file");
  }
}

export function validateRecords(records) {
  const errors = [];
  const requiredFields = [
    "firstname",
    "lastname",
    "employee_id",
    "email",
    "department",
  ];

  records.forEach((record, index) => {
    requiredFields.forEach((field) => {
      if (!record[field]) {
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
