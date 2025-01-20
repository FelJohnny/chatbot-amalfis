const { Sequelize } = require('sequelize');
const dbConfig = require('./database/db.js');

// Instância para o banco de dados Sisplan
const sequelizeSisplan = new Sequelize(dbConfig.sisplan.database, dbConfig.sisplan.username, dbConfig.sisplan.password, {
    host: dbConfig.sisplan.host,
    port: dbConfig.sisplan.port,
    dialect: dbConfig.sisplan.dialect,
});

// Instância para o banco de dados AmalfisCli
const sequelizeAmalfisCli = new Sequelize(dbConfig.amalfisCli.database, dbConfig.amalfisCli.username, dbConfig.amalfisCli.password, {
    host: dbConfig.amalfisCli.host,
    port: dbConfig.amalfisCli.port,
    dialect: dbConfig.amalfisCli.dialect,
});

module.exports = {
    sequelizeSisplan,
    sequelizeAmalfisCli,
};
