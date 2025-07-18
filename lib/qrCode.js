import QRCode from "qrcode";

export async function generateQRCode(data, options = {}) {
  try {
    if (options.type === "image/png") {
      // Return PNG buffer
      return await QRCode.toBuffer(data, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
        type: "image/png",
      });
    } else {
      // Return data URL (default)
      return await QRCode.toDataURL(data, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
      });
    }
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

// Function to verify QR code
export function verifyQRCode(qrCodeData, employeeId) {
  return qrCodeData === employeeId;
}
