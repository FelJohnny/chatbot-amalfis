import express from "express";
import routes from "./routes";
const { sequelizeSisplan, sequelizeAmalfisCli } = require("./config/config.js");

const app = express();

routes(app);

// Autenticação do banco de dados Sisplan
sequelizeSisplan
  .authenticate()
  .then(() => {
    console.log("Conexão com o SISPLAN estabelecida com sucesso");
  })
  .catch((err: any) => {
    console.error("Não foi possível se conectar com o SISPLAN", err);
  });

// Autenticação do banco de dados AmalfisCli
sequelizeAmalfisCli
  .authenticate()
  .then(() => {
    console.log("Conexão com o AMALFIS-CHATBOT estabelecida com sucesso");
  })
  .catch((err: any) => {
    console.error("Não foi possível se conectar com o AMALFIS-CHATBOT", err);
  });

export default app;
