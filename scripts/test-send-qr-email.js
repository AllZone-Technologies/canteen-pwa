require("dotenv").config();
const { sendQRCodeEmail } = require("../lib/email");

async function testSendQRCodeEmail() {
  const to = "test@example.com"; // Replace with a valid email address for testing
  const name = "Test User";
  const qrCodeDataUrl = "https://example.com/qr-code.png"; // Replace with a valid QR code URL

  try {
    const info = await sendQRCodeEmail(to, name, qrCodeDataUrl);
    console.log("Email sent successfully:", info);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

testSendQRCodeEmail();
