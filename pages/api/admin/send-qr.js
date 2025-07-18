require("dotenv").config();
import { Employee } from "../../../models";
import { sendQRCodeEmail } from "../../../lib/email";
import { generateQRCode } from "../../../lib/qrCode";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { employee_id } = req.body;

    if (!employee_id) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    // Find employee
    const employee = await Employee.findOne({
      where: { employee_id },
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if employee has a valid email
    if (!employee.email) {
      return res
        .status(400)
        .json({ message: "Employee does not have a valid email address" });
    }

    // Log the email address for debugging
    console.log("Sending QR code to email:", employee.email);

    // Generate QR code on the fly
    const qrCodeDataUrl = await generateQRCode(employee.employee_id);

    // Send QR code email
    await sendQRCodeEmail({
      to: employee.email,
      employeeId: employee.employee_id,
      qrCodeDataUrl: qrCodeDataUrl,
      employeeName: `${employee.firstname} ${employee.lastname}`,
    });

    return res.status(200).json({
      message: "QR code sent successfully",
      data: {
        email: employee.email,
      },
    });
  } catch (error) {
    console.error("Error sending QR code:", error);
    return res.status(500).json({ message: "Failed to send QR code" });
  }
}
