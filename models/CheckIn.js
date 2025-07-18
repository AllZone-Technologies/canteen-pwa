module.exports = (sequelize, DataTypes) => {
  const CheckIn = sequelize.define(
    "CheckIn",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Employees",
          key: "id",
        },
      },
      checkin_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      source_type: {
        type: DataTypes.ENUM("QR", "MANUAL"),
        allowNull: false,
        defaultValue: "QR",
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "VisitLogs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return CheckIn;
};
