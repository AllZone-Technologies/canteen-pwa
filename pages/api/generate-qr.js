import { generateQRCode } from "../../lib/qrCode";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { data, employee_id, filename } = req.body;
    // Accept either 'data' (for contractors) or 'employee_id' (for employees)
    const qrData = data || employee_id;
    if (!qrData) {
      return res.status(400).json({ message: "QR code data is required" });
    }

    // Generate QR code as a PNG buffer
    const pngBuffer = await generateQRCode(qrData, { type: "image/png" });

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename || "qr-code.png"}"`
    );
    return res.status(200).send(pngBuffer);
  } catch (error) {
    console.error("Error generating QR code:", error);
    return res.status(500).json({ message: "Failed to generate QR code" });
  }
}
