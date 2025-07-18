import db from "../../../models";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
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

    res.status(200).json({ message: "Token is valid" });
  } catch (error) {
    console.error("Validate reset token error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
