"use strict";

const { Sequelize } = require("sequelize");
const config = require("../config/database");

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const Employee = require("./Employee")(sequelize, Sequelize.DataTypes);
const VisitLog = require("./VisitLog")(sequelize, Sequelize.DataTypes);
const AdminUser = require("./AdminUser")(sequelize, Sequelize.DataTypes);
const Contractor = require("./Contractor")(sequelize, Sequelize.DataTypes);
const MealDeduction = require("./MealDeduction")(
  sequelize,
  Sequelize.DataTypes
);

// Associations
// Note: VisitLog association removed to allow contractor check-ins
// VisitLog can contain both employee_id and contractor identifiers
Employee.hasMany(MealDeduction, {
  foreignKey: "employee_id",
  sourceKey: "employee_id",
});
MealDeduction.belongsTo(Employee, {
  foreignKey: "employee_id",
  targetKey: "employee_id",
});

module.exports = {
  sequelize,
  Sequelize,
  Employee,
  VisitLog,
  AdminUser,
  Contractor,
  MealDeduction,
};
