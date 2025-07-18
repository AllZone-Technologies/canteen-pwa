import db from "../../../models";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await db.sequelize.authenticate();
    console.log("Database connection successful for QR update");

    // Find all employees
    const employees = await db.Employee.findAll();
    let updatedCount = 0;
    const updatedEmployees = [];

    // Iterate through employees and update QR code data if needed
    for (const employee of employees) {
      const expectedQrCodeData = `EMP${employee.employee_id}`;

      // Check if qr_code_data is missing or invalid
      if (
        !employee.qr_code_data ||
        employee.qr_code_data !== expectedQrCodeData
      ) {
        console.log(`Updating QR code for employee: ${employee.employee_id}`);
        await employee.update(
          { qr_code_data: expectedQrCodeData },
          { fields: ["qr_code_data"] } // Only update the qr_code_data field
        );
        updatedCount++;
        updatedEmployees.push({
          id: employee.id,
          employee_id: employee.employee_id,
        });
      }
    }

    console.log(`QR code update finished. Updated count: ${updatedCount}`);

    return res.status(200).json({
      message: "Existing QR codes updated successfully",
      updatedCount: updatedCount,
      updatedEmployees: updatedEmployees,
    });
  } catch (error) {
    console.error("Error updating QR codes:", error);
    return res.status(500).json({ error: error.message });
  }
}
