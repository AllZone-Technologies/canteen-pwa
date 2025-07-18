import db from "../../../models";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Find admin user with this reset token
    const admin = await db.AdminUser.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          [db.Sequelize.Op.gt]: new Date(), // Token not expired
        },
      },
    });

    if (!admin) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Update password and clear reset token
    await admin.update({
      password, // This will be hashed by the beforeUpdate hook
      resetToken: null,
      resetTokenExpiry: null,
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
