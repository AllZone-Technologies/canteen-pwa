const { Client } = require("@microsoft/microsoft-graph-client");
const { ConfidentialClientApplication } = require("@azure/msal-node");
require("isomorphic-fetch");

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: process.env.MS_CLIENT_ID,
    clientSecret: process.env.MS_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}`,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

// Initialize Graph client
async function getGraphClient() {
  const authProvider = {
    getAccessToken: async () => {
      try {
        const result = await cca.acquireTokenByClientCredential({
          scopes: ["https://graph.microsoft.com/.default"],
        });
        return result.accessToken;
      } catch (error) {
        console.error("Error acquiring token:", error);
        throw error;
      }
    },
  };

  return Client.initWithMiddleware({
    authProvider: authProvider,
  });
}

async function sendEmail({ to, subject, html, attachments }) {
  try {
    const graphClient = await getGraphClient();

    const message = {
      subject: subject,
      body: {
        contentType: "HTML",
        content: html,
      },
      toRecipients: [
        {
          emailAddress: {
            address: to,
          },
        },
      ],
    };

    // Handle attachments if provided
    if (attachments && attachments.length > 0) {
      message.attachments = attachments.map((att) => ({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: att.filename,
        contentType: att.contentType || "application/octet-stream",
        contentBytes: att.content.toString("base64"),
      }));
    }

    // Send email using the application's identity
    const result = await graphClient
      .api("/users/noreply@uhpower.net/sendMail")
      .post({
        message: message,
        saveToSentItems: true,
      });

    console.log("Email sent successfully via Graph API");
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("Error sending email via Graph API:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

async function sendQRCodeEmail(to, employeeName, qrCodeDataUrl) {
  // Handle both object and individual parameter formats
  if (typeof to === "object" && to !== null) {
    // Object format: { to, employeeName, qrCodeDataUrl, employeeId }
    const params = to;
    to = params.to;
    employeeName = params.employeeName || params.employeeId;
    qrCodeDataUrl = params.qrCodeDataUrl;
  }

  console.log("Sending QR code email to:", to);
  console.log("Employee name:", employeeName);
  console.log("QR Code Data URL type:", typeof qrCodeDataUrl);

  try {
    // Validate inputs
    if (!to || !employeeName || !qrCodeDataUrl) {
      throw new Error(
        `Missing required parameters: to=${!!to}, employeeName=${!!employeeName}, qrCodeDataUrl=${!!qrCodeDataUrl}`
      );
    }

    // Validate QR code data URL format
    if (!qrCodeDataUrl.startsWith("data:image/")) {
      throw new Error(
        `Invalid QR code data URL format: ${qrCodeDataUrl.substring(0, 50)}...`
      );
    }

    // Convert data URL to buffer for attachment
    const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(",")[1], "base64");

    const attachments = [
      {
        filename: `${employeeName}_qrcode.png`,
        content: qrCodeBuffer,
        contentType: "image/png",
      },
    ];

    return await sendEmail({
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
      attachments,
    });
  } catch (error) {
    console.error("Error sending QR code email:", error);
    throw error;
  }
}

module.exports = { sendEmail, sendQRCodeEmail };
