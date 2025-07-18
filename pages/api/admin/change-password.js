import { verifyToken } from "../../../utils/jwt";
import db from "../../../models";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Verify authentication
  const token = req.cookies.admin_token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long" });
    }

    // Find the admin user
    const admin = await db.AdminUser.findByPk(decoded.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    // Verify current password
    const isValidCurrentPassword = await admin.validatePassword(
      currentPassword
    );
    if (!isValidCurrentPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Check if new password is the same as current password
    const isSamePassword = await admin.validatePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    // Update password (this will be hashed by the beforeUpdate hook)
    await admin.update({
      password: newPassword,
    });

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
