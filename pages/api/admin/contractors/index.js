import db from "../../../../models";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { page = 1, limit = 10, search = "", status = "" } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};

      if (search) {
        whereClause = {
          [db.Sequelize.Op.or]: [
            { company_name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { contact_person: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { contact_email: { [db.Sequelize.Op.iLike]: `%${search}%` } },
          ],
        };
      }

      if (status === "active") {
        whereClause.is_active = true;
      } else if (status === "inactive") {
        whereClause.is_active = false;
      }

      const { count, rows: contractors } = await db.Contractor.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      res.status(200).json({
        contractors,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching contractors:", error);
      res.status(500).json({ error: "Failed to fetch contractors" });
    }
  } else if (req.method === "POST") {
    try {
      const {
        company_name,
        contact_person,
        contact_email,
        contact_phone,
        notes,
      } = req.body;

      if (!company_name) {
        return res.status(400).json({ error: "Company name is required" });
      }

      // Generate unique QR code data for the contractor
      const qrCodeData = `CONTRACTOR_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const contractor = await db.Contractor.create({
        company_name,
        contact_person,
        contact_email,
        contact_phone,
        qr_code_data: qrCodeData,
        notes,
        is_active: true,
      });

      res.status(201).json({ contractor });
    } catch (error) {
      console.error("Error creating contractor:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        res.status(400).json({ error: "Company name already exists" });
      } else {
        res.status(500).json({ error: "Failed to create contractor" });
      }
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
