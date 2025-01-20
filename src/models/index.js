"use strict";

const fs = require("fs");
const path = require("path");
const sequelize = require("sequelize");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const dbConfig = require(__dirname + "/../config/database/db.js");
const db = {};

// Inicializa as instâncias do Sequelize para os dois bancos de dados
const sequelizeSisplan = new Sequelize(
  dbConfig.sisplan.database,
  dbConfig.sisplan.username,
  dbConfig.sisplan.password,
  dbConfig.sisplan
);
const sequelizeAmalfisCli = new Sequelize(
  dbConfig.amalfisCli.database,
  dbConfig.amalfisCli.username,
  dbConfig.amalfisCli.password,
  dbConfig.amalfisCli
);

// Função para inicializar os models para cada banco de dados
const initializeModels = (sequelizeInstance, dirname) => {
  const models = {};
  fs.readdirSync(dirname)
    .filter((file) => {
      return (
        file.indexOf(".") !== 0 &&
        file !== basename &&
        file.slice(-3) === ".js" &&
        file.indexOf(".test.js") === -1
      );
    })
    .forEach((file) => {
      const model = require(path.join(dirname, file))(
        sequelizeInstance,
        Sequelize.DataTypes
      );
      models[model.name] = model;
    });

  Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  return models;
};

// Inicializa os models para cada banco de dados
const modelsSisplan = initializeModels(sequelizeSisplan, __dirname);
const modelsAmalfisCli = initializeModels(sequelizeAmalfisCli, __dirname);

// Adiciona os models ao objeto db para exportação
db.sisplan = modelsSisplan;
db.amalfisCli = modelsAmalfisCli;
db.sequelizeSisplan = sequelizeSisplan;
db.sequelizeAmalfisCli = sequelizeAmalfisCli;
db.Sequelize = Sequelize;

module.exports = db;
