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
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: "Date of deduction",
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
