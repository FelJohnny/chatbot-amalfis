const { amalfisCli } = require("../models/index.js");
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const API_URL = process.env.API_URL;
const https = require("https");

// Função genérica para enviar requisições HTTPS
const sendHttpsRequest = async (url, method, data, headers) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers,
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (err) {
          reject(new Error("Erro ao parsear a resposta: " + err.message));
        }
      });
    });

    req.on("error", (err) => {
      reject(new Error("Erro na requisição: " + err.message));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

class ChatBot_Services {
  async buscaClientePorNumeroContato(numContato) {
    const cliente = await amalfisCli.ChatbotCliente.findOne({
      where: { numero_contato: numContato },
    });
    if (cliente === null) {
      console.log("cliente não encontrado");
      return { status: false, retorno: cliente };
    } else {
      console.log("cliente encontrado");
      return { status: true, retorno: cliente };
    }
  }

  async buscaRespostaCliente(idResposta) {
    const resposta = await amalfisCli.chatbot_respostas.findOne({
      where: { id: idResposta },
    });
    if (resposta === null) {
      console.log("resposta não encontrada");
      return resposta;
    } else {
      console.log("resposta encontrada");
      return { resposta: resposta.dataValues.menssagem };
    }
  }

  async respondeWhatsApp(to, message, type) {
    try {
      const data = {
        messaging_product: "whatsapp",
        to,
        type: type,
        text: { body: message },
      };
      const headers = {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      };
      const response = await sendHttpsRequest(API_URL, "POST", data, headers);
      console.log({
        message: "Mensagem respondida com sucesso!",
        data: response,
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem de texto:", error.message);
    }
  }
}

module.exports = ChatBot_Services;
