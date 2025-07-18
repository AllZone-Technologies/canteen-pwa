const nodemailer = require("nodemailer");

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, html, attachments }) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}

async function sendQRCodeEmail({ to, employeeName, qrCodeDataUrl }) {
  console.log("Sending QR code email to:", to);
  console.log("Employee name:", employeeName);
  console.log("QR Code Data URL:", qrCodeDataUrl);

  try {
    // Convert data URL to buffer for attachment
    const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(",")[1], "base64");

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || "Canteen Admin <admin@example.com>",
      to,
      subject: "Your Canteen QR Code",
      html: `
        <h1>Welcome to the Canteen!</h1>
        <p>Hello ${employeeName},</p>
        <p>Here is your QR code for accessing the canteen:</p>
        <img src="cid:qrcode" alt="QR Code" style="width: 300px; height: 300px;" />
        <p>Please save this QR code and present it when entering the canteen.</p>
        <p>Best regards,<br>Canteen Admin</p>
      `,
      attachments: [
        {
          filename: `${employeeName}_qrcode.png`,
          content: qrCodeBuffer,
          cid: "qrcode",
        },
      ],
    });

    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

module.exports = { sendEmail, sendQRCodeEmail };
