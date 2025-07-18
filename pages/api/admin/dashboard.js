import db from "../../../models";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get total employees count
    const totalEmployees = await db.Employee?.count();

    // Get total check-ins count
    const totalCheckins = await db.VisitLog.count();

    // Get total guests count
    const totalGuests = (await db.VisitLog.sum("guest_count")) || 0;

    // Get today's check-ins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCheckins = await db.VisitLog.count({
      where: {
        checkin_time: {
          [db.Sequelize.Op.gte]: today,
        },
      },
    });

    // Get today's guests
    const todayGuests =
      (await db.VisitLog.sum("guest_count", {
        where: {
          checkin_time: {
            [db.Sequelize.Op.gte]: today,
          },
        },
      })) || 0;

    // Get active employees (those who checked in within the last hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const activeEmployees = await db.VisitLog.count({
      where: {
        checkin_time: {
          [db.Sequelize.Op.gte]: oneHourAgo,
        },
      },
      distinct: true,
      col: "employee_id",
    });

    // Get check-in trend for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const checkinTrend = await Promise.all(
      last7Days.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        const count = await db.VisitLog.count({
          where: {
            checkin_time: {
              [db.Sequelize.Op.gte]: date,
              [db.Sequelize.Op.lt]: nextDate,
            },
          },
        });
        return count;
      })
    );

    // Get department distribution
    const departmentDistribution = await db.Employee.findAll({
      attributes: [
        "department",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      group: ["department"],
    });

    // Get check-ins by source type
    const sourceTypeDistribution = await db.VisitLog.findAll({
      attributes: [
        "source_type",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      group: ["source_type"],
    });

    // Get today's check-ins by hour (for busiest time analysis)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const hourlyCheckins = await db.VisitLog.findAll({
      attributes: [
        [
          db.sequelize.fn(
            "EXTRACT",
            db.sequelize.literal("HOUR FROM checkin_time")
          ),
          "hour",
        ],
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      where: {
        checkin_time: {
          [db.Sequelize.Op.between]: [todayStart, todayEnd],
        },
      },
      group: [
        db.sequelize.fn(
          "EXTRACT",
          db.sequelize.literal("HOUR FROM checkin_time")
        ),
      ],
      order: [
        [
          db.sequelize.fn(
            "EXTRACT",
            db.sequelize.literal("HOUR FROM checkin_time")
          ),
          "ASC",
        ],
      ],
    });

    // Get contractors vs employees check-ins
    const contractorsCheckins = await db.VisitLog.count({
      where: {
        employee_id: {
          [db.Sequelize.Op.like]: "CONTRACTOR_%",
        },
        checkin_time: {
          [db.Sequelize.Op.gte]: todayStart,
        },
      },
    });

    const employeesCheckins = await db.VisitLog.count({
      where: {
        employee_id: {
          [db.Sequelize.Op.notLike]: "CONTRACTOR_%",
        },
        checkin_time: {
          [db.Sequelize.Op.gte]: todayStart,
        },
      },
    });

    // Get guest count analysis for the last 7 days
    const guestTrend = await Promise.all(
      last7Days.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        const guestCount = await db.VisitLog.sum("guest_count", {
          where: {
            checkin_time: {
              [db.Sequelize.Op.gte]: date,
              [db.Sequelize.Op.lt]: nextDate,
            },
          },
        });
        return guestCount || 0;
      })
    );

    res.status(200).json({
      stats: {
        totalEmployees,
        totalCheckins,
        totalGuests,
        todayCheckins,
        todayGuests,
        contractorsCheckins,
        employeesCheckins,
      },
      charts: {
        checkinTrend: {
          labels: last7Days.map((date) =>
            date.toLocaleDateString("en-US", { weekday: "short" })
          ),
          data: checkinTrend,
        },
        departmentDistribution: {
          labels: departmentDistribution.map((dept) => dept.department),
          data: departmentDistribution.map((dept) => dept.get("count")),
        },

        sourceTypeDistribution: {
          labels: sourceTypeDistribution.map((source) => source.source_type),
          data: sourceTypeDistribution.map((source) => source.get("count")),
        },
        hourlyCheckins: {
          labels: hourlyCheckins.map((hour) => `${hour.get("hour")}:00`),
          data: hourlyCheckins.map((hour) => hour.get("count")),
        },
        contractorsVsEmployees: {
          labels: ["Employees", "Contractors"],
          data: [employeesCheckins, contractorsCheckins],
        },
        guestTrend: {
          labels: last7Days.map((date) =>
            date.toLocaleDateString("en-US", { weekday: "short" })
          ),
          data: guestTrend,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
}
