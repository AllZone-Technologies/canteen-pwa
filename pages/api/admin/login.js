import { signToken } from "../../../utils/jwt";
import db from "../../../models";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Ensure database connection is established
    await db.sequelize.authenticate();
    console.log("Database connection successful");

    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find the admin user
    const admin = await db.AdminUser.findOne({ where: { email } });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValid = await admin.validatePassword(password);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token with role information
    const token = await signToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
    });

    // Set the token in an HTTP-only cookie
    res.setHeader(
      "Set-Cookie",
      `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
    );

    // Return success response
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
