import { sendQRCodeEmail } from "../../../lib/email";
import { generateQRCode } from "../../../lib/qrCode";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        message: "Email and name are required",
      });
    }

    // Generate a test QR code
    const qrCodeData = {
      type: "test",
      timestamp: new Date().toISOString(),
    };
    const qrCodeDataUrl = await generateQRCode(qrCodeData);

    // Send the test email
    const info = await sendQRCodeEmail(email, name, qrCodeDataUrl);

    return res.status(200).json({
      message: "Test email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return res.status(500).json({
      message: "Failed to send test email",
      error: error.message,
    });
  }
}
