const { Router } = require("express");
const ChatBot_Controller = require("../controller/chatBot_Controller");

const route = Router();

const chatBot_Controller = new ChatBot_Controller();

route.get("/whatsapp/webhook", (req, res) =>
  chatBot_Controller.verifyWebhook(req, res)
);

route.post("/whatsapp/webhook", (req, res) =>
  chatBot_Controller.webhookWhatsApp(req, res)
);

route.post("/whatsapp/send-text", (req, res) =>
  chatBot_Controller.sendTextMessage(req, res)
);

module.exports = route;
