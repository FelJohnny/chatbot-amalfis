const { json } = require("express");
const chatBot_router = require("./chatBot_Routes.js");
const cors = require("cors");

module.exports = (app) => {
  app.use(cors());
  app.use(json());
  app.use(chatBot_router);
};
