import db from "../../../../models";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const checkins = await db.VisitLog.findAll({
      include: [
        {
          model: db.Employee,
          as: "Employee",
          attributes: ["firstname", "lastname", "department", "nationality"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const csvData = checkins.map((checkin) => ({
      "Employee ID": checkin.employee_id,
      "Employee Name":
        `${checkin.Employee?.firstname || ""} ${
          checkin.Employee?.lastname || ""
        }`.trim() || "N/A",
      Department: checkin.Employee?.department || "N/A",
      Nationality: checkin.Employee?.nationality || "N/A",
      "Check-in Time": checkin.created_at,
      Username: checkin.username || "N/A",
    }));

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="checkins-${
        new Date().toISOString().split("T")[0]
      }.csv"`
    );

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting checkins:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
