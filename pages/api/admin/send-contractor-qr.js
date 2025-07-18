import db from "../../../models";
import { generateQRCode } from "../../../lib/qrCode";
import { sendEmail } from "../../../lib/email";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { contractor_id } = req.body;
    if (!contractor_id) {
      return res.status(400).json({ message: "Contractor ID is required" });
    }
    const contractor = await db.Contractor.findByPk(contractor_id);
    if (!contractor) {
      return res.status(404).json({ message: "Contractor not found" });
    }
    if (!contractor.contact_email) {
      return res
        .status(400)
        .json({ message: "Contractor does not have a contact email" });
    }
    // Generate QR code as PNG buffer
    const pngBuffer = await generateQRCode(contractor.qr_code_data, {
      type: "image/png",
    });
    // Send email with QR code attached
    await sendEmail({
      to: contractor.contact_email,
      subject: `Your Contractor QR Code for ${contractor.company_name}`,
      text: `Dear ${
        contractor.contact_person || contractor.company_name
      },\n\nAttached is your QR code for access.\n\nThank you.`,
      attachments: [
        {
          filename: `${contractor.company_name}_QR.png`,
          content: pngBuffer,
          contentType: "image/png",
        },
      ],
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending contractor QR code email:", error);
    return res.status(500).json({ message: "Failed to send QR code email" });
  }
}
