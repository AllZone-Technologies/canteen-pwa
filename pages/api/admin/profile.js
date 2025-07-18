import { verifyToken } from "../../../utils/jwt";
import db from "../../../models";

export default async function handler(req, res) {
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

    // Find the admin user
    const admin = await db.AdminUser.findByPk(decoded.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    if (req.method === "GET") {
      // Return profile information
      return res.status(200).json({
        name: admin.name,
        email: admin.email,
        role: admin.role,
      });
    }

    if (req.method === "PUT") {
      const { name, email } = req.body;

      // Validate input
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }

      // Check if email is valid
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if email is already taken by another user
      const existingUser = await db.AdminUser.findOne({
        where: {
          email,
          id: { [db.Sequelize.Op.ne]: admin.id }, // Exclude current user
        },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email is already taken" });
      }

      // Update profile
      await admin.update({
        name,
        email,
      });

      return res.status(200).json({
        message: "Profile updated successfully",
        name: admin.name,
        email: admin.email,
      });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Profile API error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
