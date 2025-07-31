module.exports = (sequelize, DataTypes) => {
  const MealDeduction = sequelize.define(
    "MealDeduction",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Employee number",
      },
      wage_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "3020",
        comment: "Fixed wage type",
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "Deduction amount in QAR",
      },
      date: {
        type: DataTypes.STRING, // Changed from DATEONLY to STRING
        allowNull: false,
        comment:
          "Deduction period (21st to 20th format: '21 January 2024 - 20 February 2024')",
        validate: {
          is: /^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s+-\s+\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/, // Validate period format
        },
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "QAR",
        comment: "Currency code",
      },
      visit_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: "Number of visits on this date",
      },
    },
    {
      tableName: "MealDeductions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["employee_id", "date"],
          unique: true,
        },
      ],
    }
  );

  return MealDeduction;
};
