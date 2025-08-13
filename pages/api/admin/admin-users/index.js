import { withAdminOnly } from "../../../../middleware/auth";
import { sendEmail } from "../../../../lib/email";
import db from "../../../../models";

function generateRandomPassword() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function sendManagerCredentialsEmail(email, name, password, role) {
  const subject = `Your ${
    role === "manager" ? "Manager" : "Admin"
  } Account Credentials`;
  const html = `
    <h1>Welcome to the Canteen Management System!</h1>
    <p>Hello ${name},</p>
    <p>Your ${
      role === "manager" ? "manager" : "admin"
    } account has been created successfully.</p>
    <p><strong>Login Credentials:</strong></p>
    <ul>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Password:</strong> ${password}</li>
    </ul>
    <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
    <p>You can access the system at: ${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/admin/login</p>
    <p>Best regards,<br>Canteen Admin Team</p>
  `;

  return await sendEmail({ to: email, subject, html });
}

async function sendPasswordUpdateEmail(email, name, newPassword) {
  const subject = "Your Password Has Been Updated";
  const html = `
    <h1>Password Update Notification</h1>
    <p>Hello ${name},</p>
    <p>Your password has been updated by an administrator.</p>
    <p><strong>New Password:</strong> ${newPassword}</p>
    <p><strong>Important:</strong> Please change your password after your next login for security purposes.</p>
    <p>You can access the system at: ${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/admin/login</p>
    <p>Best regards,<br>Canteen Admin Team</p>
  `;

  return await sendEmail({ to: email, subject, html });
}

async function handler(req, res) {
  // Add debugging
  console.log("Admin users API called");
  console.log("Cookies:", req.cookies);
  console.log("Method:", req.method);

  if (req.method === "GET") {
    try {
      const { page = 1, search = "" } = req.query;
      const limit = 10;
      const offset = (page - 1) * limit;

      let whereCondition = {};
      if (search) {
        whereCondition = {
          [db.Sequelize.Op.or]: [
            { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { email: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { role: { [db.Sequelize.Op.iLike]: `%${search}%` } },
          ],
        };
      }

      const { count, rows: users } = await db.AdminUser.findAndCountAll({
        where: whereCondition,
        attributes: ["id", "name", "email", "role", "createdAt"],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      const totalPages = Math.ceil(count / limit);

      return res.status(200).json({
        users,
        totalPages,
        currentPage: parseInt(page),
        totalCount: count,
      });
    } catch (error) {
      console.error("Error fetching admin users:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, email, role } = req.body;

      // Validate required fields
      if (!name || !email || !role) {
        return res.status(400).json({
          message: "Name, email, and role are required",
          received: { name, email, role }
        });
      }

      // Validate role
      if (!["admin", "manager"].includes(role)) {
        return res.status(400).json({
          message: "Role must be either 'admin' or 'manager'",
          received: { name, email, role },
          validRoles: ["admin", "manager"]
        });
      }

      // Check if email already exists
      const existingUser = await db.AdminUser.findOne({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Email address already exists",
        });
      }

      // Generate random password
      const password = generateRandomPassword();

      // Create new user
      const newUser = await db.AdminUser.create({
        name,
        email,
        password,
        role,
      });

      // Send credentials email
      try {
        await sendManagerCredentialsEmail(email, name, password, role);
      } catch (emailError) {
        console.error("Failed to send credentials email:", emailError);
        // Continue with user creation even if email fails
      }

      return res.status(201).json({
        message: `${
          role === "manager" ? "Manager" : "Admin"
        } created successfully`,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error("Error creating admin user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

export default withAdminOnly(handler);
