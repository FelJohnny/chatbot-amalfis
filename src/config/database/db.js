require("dotenv/config.js");

module.exports = {
  sisplan: {
    username: process.env.USER_DB,
    password: process.env.PASSWORD_DB,
    database: process.env.DATABASE_DB,
    host: process.env.HOST_DB,
    port: process.env.PORT_DB,
    dialect: process.env.DIALECT_DB,
  },
  amalfisCli: {
    username: process.env.USER_DB2,
    password: process.env.PASSWORD_DB2,
    database: process.env.DATABASE_DB2,
    host: process.env.HOST_DB2,
    port: process.env.PORT_DB2,
    dialect: process.env.DIALECT_DB2,
  },
};

//criado para realizar as migrações, ele nao suporta o que consta no config-db.js por conta de ser um objeto.
