import { generateQRCode } from "../../../../lib/qrCode";
import { sendQRCodeEmail } from "../../../../lib/email";
import db from "../../../../models";

function isValidEmail(email) {
  // Simple email regex
  return /\S+@\S+\.\S+/.test(email);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      await db.sequelize.authenticate();

      const { page = 1, filters = "{}", sort = "{}", search } = req.query;
      const parsedFilters = JSON.parse(filters);
      const parsedSort = JSON.parse(sort);

      let whereCondition = {};
      let orderCondition = [["created_at", "DESC"]];

      // Handle search
      if (search) {
        whereCondition = {
          [db.Sequelize.Op.or]: [
            { firstname: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { lastname: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { employee_id: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { email: { [db.Sequelize.Op.iLike]: `%${search}%` } },
          ],
        };
      }

      // Apply filters
      if (parsedFilters.department && parsedFilters.department !== "all") {
        whereCondition.department = parsedFilters.department;
      }

      // Apply sorting
      if (parsedSort.by) {
        const allowedSortColumns = [
          "firstname",
          "lastname",
          "employee_id",
          "email",
          "department",
          "nationality",
        ];
        if (allowedSortColumns.includes(parsedSort.by)) {
          const order = (parsedSort.order || "ASC").toUpperCase();
          if (order === "ASC" || order === "DESC") {
            orderCondition = [[parsedSort.by, order]];
          }
        }
      }

      // Calculate pagination
      const limit = 5; // items per page
      const offset = (page - 1) * limit;

      // Get total count for pagination
      const totalCount = await db.Employee.count({ where: whereCondition });
      const totalPages = Math.ceil(totalCount / limit);

      const users = await db.Employee.findAll({
        where: whereCondition,
        attributes: [
          "id",
          "firstname",
          "lastname",
          "employee_id",
          "email",
          "department",
          "created_at",
          "qr_code_data",
        ],
        order: orderCondition,
        limit,
        offset,
      });

      return res.status(200).json({
        users,
        totalPages,
        currentPage: parseInt(page),
        totalCount,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "POST") {
    const { firstname, lastname, employee_id, email, department } = req.body;

    console.log("Received employee creation request:", {
      firstname,
      lastname,
      employee_id,
      email,
      department,
    });

    // Validate required fields
    if (!firstname || !lastname || !employee_id || !email) {
      console.log("Missing required fields:", {
        firstname,
        lastname,
        employee_id,
        email,
      });
      return res.status(400).json({
        message: "Missing required fields",
        details: {
          firstname: !firstname ? "First name is required" : null,
          lastname: !lastname ? "Last name is required" : null,
          employee_id: !employee_id ? "Employee ID is required" : null,
          email: !email ? "Email is required" : null,
        },
      });
    }

    if (!isValidEmail(email)) {
      console.log("Invalid email format:", email);
      return res.status(400).json({
        message: "Invalid email format",
        details: {
          email: "Please enter a valid email address",
        },
      });
    }

    try {
      // Check if employee_id or email already exists
      const existingEmployee = await db.Employee.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { employee_id: employee_id },
            { email: email },
          ],
        },
      });

      if (existingEmployee) {
        console.log("Employee already exists:", {
          existingEmployee,
          newEmployee: { employee_id, email },
        });
        return res.status(409).json({
          message: "Employee already exists",
          details: {
            employee_id:
              existingEmployee.employee_id === employee_id
                ? "Employee ID already exists"
                : null,
            email:
              existingEmployee.email === email ? "Email already exists" : null,
          },
        });
      }

      // Generate QR code image for email (but store only employee_id in DB)
      let qrCodeImage = null;
      try {
        qrCodeImage = await generateQRCode(employee_id);
        console.log("QR code generated successfully");
      } catch (qrError) {
        console.error(
          `Failed to generate QR code for ${employee_id}:`,
          qrError
        );
      }

      console.log("Creating new employee with data:", {
        firstname,
        lastname,
        employee_id,
        email,
        department,
        qr_code_data: employee_id, // Store only the employee_id
      });

      const newEmployee = await db.Employee.create({
        firstname,
        lastname,
        employee_id,
        email,
        department,
        qr_code_data: employee_id, // Store only the employee_id
      });

      console.log("Successfully created employee:", newEmployee.toJSON());

      // Automatically send QR code email
      if (qrCodeImage) {
        try {
          await sendQRCodeEmail({
            to: newEmployee.email,
            employeeId: newEmployee.employee_id,
            qrCodeDataUrl: qrCodeImage,
            employeeName: `${newEmployee.firstname} ${newEmployee.lastname}`,
          });
          console.log(`QR code email sent to ${newEmployee.email}`);
        } catch (emailError) {
          console.error(
            `Failed to send QR code email to ${newEmployee.email}:`,
            emailError
          );
        }
      }

      return res.status(201).json({ employee: newEmployee });
    } catch (error) {
      console.error("Error creating employee:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          message: "Unique constraint violation",
          details: {
            employee_id: error.errors?.some((e) => e.path === "employee_id")
              ? "Employee ID already exists"
              : null,
            email: error.errors?.some((e) => e.path === "email")
              ? "Email already exists"
              : null,
          },
        });
      }
      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          message: "Validation error",
          details: error.errors.reduce(
            (acc, err) => ({
              ...acc,
              [err.path]: err.message,
            }),
            {}
          ),
        });
      }
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
        details: error.errors ? error.errors.map((e) => e.message) : undefined,
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
