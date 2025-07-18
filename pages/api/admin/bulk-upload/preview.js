const formidable = require("formidable");
const fs = require("fs");
// Use dynamic import for ES module compatibility
let parseFile;
try {
  ({ parseFile } = await import("../../../../lib/fileParser.js"));
} catch (e) {
  console.error("Failed to import parseFile:", e);
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
          }))
        : [];

      res.status(200).json({
        records: transformedRecords,
        totalRecords: transformedRecords.length,
        fileName: file.originalFilename,
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
