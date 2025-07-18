import db from "../../../../models";
import { Contractor } from "../../../../models";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const contractor = await Contractor.findByPk(id);

      if (!contractor) {
        return res.status(404).json({ error: "Contractor not found" });
      }

      res.status(200).json({ contractor });
    } catch (error) {
      console.error("Error fetching contractor:", error);
      res.status(500).json({ error: "Failed to fetch contractor" });
    }
  } else if (req.method === "PUT") {
    try {
      const contractor = await Contractor.findByPk(id);

      if (!contractor) {
        return res.status(404).json({ error: "Contractor not found" });
      }

      const {
        company_name,
        contact_person,
        contact_email,
        contact_phone,
        notes,
        is_active,
      } = req.body;

      const updateData = {};

      if (company_name !== undefined) updateData.company_name = company_name;
      if (contact_person !== undefined)
        updateData.contact_person = contact_person;
      if (contact_email !== undefined) updateData.contact_email = contact_email;
      if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
      if (notes !== undefined) updateData.notes = notes;
      if (is_active !== undefined) updateData.is_active = is_active;

      await contractor.update(updateData);

      res.status(200).json({ contractor });
    } catch (error) {
      console.error("Error updating contractor:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        res.status(400).json({ error: "Company name already exists" });
      } else {
        res.status(500).json({ error: "Failed to update contractor" });
      }
    }
  } else if (req.method === "DELETE") {
    try {
      const contractor = await Contractor.findByPk(id);

      if (!contractor) {
        return res.status(404).json({ error: "Contractor not found" });
      }

      await contractor.destroy();

      res.status(200).json({ message: "Contractor deleted successfully" });
    } catch (error) {
      console.error("Error deleting contractor:", error);
      res.status(500).json({ error: "Failed to delete contractor" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
