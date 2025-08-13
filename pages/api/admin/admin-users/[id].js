import { withAdminOnly } from "../../../../middleware/auth";
import { sendEmail } from "../../../../lib/email";
import db from "../../../../models";

async function sendPasswordUpdateEmail(email, name, newPassword) {
  const subject = "Your Password Has Been Updated";
  const html = `
    <h1>Password Update Notification</h1>
    <p>Hello ${name},</p>
    <p>Your password has been updated by an administrator.</p>
    <p><strong>New Password:</strong> ${newPassword}</p>
    <p><strong>Important:</strong> Please change your password after your next login for security purposes.</p>
    <p>You can access the system at: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/login</p>
    <p>Best regards,<br>Canteen Admin Team</p>
  `;

  return await sendEmail({ to: email, subject, html });
}

async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const { name, email, password } = req.body;

      // Find the user to update
      const user = await db.AdminUser.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if trying to update another admin's role (only admins can do this)
      if (req.body.role && req.body.role !== user.role) {
        return res.status(403).json({ message: "Only admins can change user roles" });
      }

      // Check if trying to delete another admin or manager (only admins can do this)
      if (req.method === "DELETE") {
        if (user.role === "admin" && req.user.id !== parseInt(id)) {
          return res.status(403).json({ message: "Cannot delete another admin" });
        }
        if (user.role === "manager" && req.user.role !== "admin") {
          return res.status(403).json({ message: "Only admins can delete managers" });
        }
      }

      // Prepare update data
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (password) updateData.password = password;

      // Check if email is already taken by another user
      if (email && email !== user.email) {
        const existingUser = await db.AdminUser.findOne({
          where: {
            email,
            id: { [db.Sequelize.Op.ne]: parseInt(id) },
          },
        });

        if (existingUser) {
          return res.status(400).json({ message: "Email is already taken" });
        }
      }

      // Update user
      await user.update(updateData);

      // Send password update email if password was changed
      if (password) {
        try {
          await sendPasswordUpdateEmail(user.email, user.name, password);
        } catch (emailError) {
          console.error("Failed to send password update email:", emailError);
          // Continue with update even if email fails
        }
      }

      return res.status(200).json({
        message: "User updated successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Error updating admin user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Find the user to delete
      const user = await db.AdminUser.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check permissions
      if (user.role === "admin" && req.user.id !== parseInt(id)) {
        return res.status(403).json({ message: "Cannot delete another admin" });
      }
      if (user.role === "manager" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can delete managers" });
      }

      // Delete user
      await user.destroy();

      return res.status(200).json({
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting admin user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

export default withAdminOnly(handler);
