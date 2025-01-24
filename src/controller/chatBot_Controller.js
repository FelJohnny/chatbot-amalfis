const { amalfisCli, Sequelize } = require("../models");
const ChatBot_Services = require("../services/chatBot_Services");
const { v4: uuidv4 } = require("uuid");

const ACCESS_TOKEN = process.env.ACCESS_TOKEN || "SEU_ACCESS_TOKEN_AQUI";
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "SEU_VERIFY_TOKEN_AQUI";
const API_URL = process.env.API_URL;

const chatbot_services = new ChatBot_Services();

//resposta de mensagens
const replyMessage = async (to, type, message) => {
  if (!to || !message || !type) {
    console.log('Os campos "to", type e "message" são obrigatórios.');
  } else {
    try {
      const data = {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      };

      const headers = {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      };

      const response = await sendHttpsRequest(API_URL, "POST", data, headers);
      console.log({
        message: "Mensagem de texto respondida com sucesso!",
        data: response,
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem de texto:", error.message);
    }
  }
};

class ChatBot_Controller {
  async verifyWebhook(req, res) {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verificado com sucesso.");
      res.status(200).send(challenge);
    } else {
      console.error("Falha na verificação do webhook.");
      res.status(403).send("Falha na verificação do webhook.");
    }
  }

  async webhookWhatsApp(req, res) {
    try {
      const body = req.body;

      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.field === "messages") {
              const messages = change.value.messages || [];

              for (const message of messages) {
                const from = message.from || "número não identificado";

                // Extrai o corpo da mensagem
                const messageBody = await chatbot_services.getMessageBody(
                  message
                );

                // 1. Busca ou cria o cliente
                const cliente = await chatbot_services.buscaOuCriaCliente(from);

                // 2. Busca ou cria a sessão
                const sessao = await chatbot_services.buscaOuCriaSessao(
                  cliente.retorno.id
                );

                // 3. Registra a mensagem recebida do cliente
                await chatbot_services.registraMensagem(
                  sessao.id,
                  cliente.retorno.id,
                  null, // resposta_id é nulo porque é mensagem do cliente
                  messageBody
                );
                console.log("Mensagem do cliente registrada com sucesso");

                // 4. Recupera a última mensagem enviada pelo chatbot
                const ultimaMensagem =
                  await chatbot_services.recuperaUltimaMensagemChatbot(
                    cliente.retorno.id,
                    sessao.id
                  );

                // 5. Determina a próxima pergunta
                let proximaPergunta;
                if (ultimaMensagem) {
                  proximaPergunta = await chatbot_services.buscaProximaResposta(
                    ultimaMensagem.resposta_id,
                    messageBody
                  );
                } else {
                  // Primeira interação
                  proximaPergunta = await chatbot_services.buscaRespostaCliente(
                    1
                  );
                }

                if (proximaPergunta) {
                  // 6. Envia a próxima mensagem ao cliente
                  const mensagemFormatada =
                    await chatbot_services.processaMensagem(
                      proximaPergunta.tipo,
                      proximaPergunta.mensagem,
                      proximaPergunta.opcoes || []
                    );

                  await chatbot_services.respondeWhatsApp(
                    from,
                    mensagemFormatada,
                    proximaPergunta.tipo === "texto" ? "text" : "interactive"
                  );

                  // 7. Registra a mensagem enviada pelo chatbot
                  await chatbot_services.registraMensagem(
                    sessao.id,
                    cliente.retorno.id,
                    proximaPergunta.id,
                    proximaPergunta.mensagem
                  );
                  console.log("Mensagem do chatbot registrada com sucesso");
                } else {
                  console.log(
                    "Fim do fluxo ou próxima pergunta não encontrada. Encerrando interação."
                  );
                }
              }
            }
          }
        }
      }

      res.sendStatus(200); // Confirma o recebimento do webhook
    } catch (error) {
      console.error("Erro ao processar webhook:", error.message);
      res.sendStatus(500);
    }
  }

  async sendTextMessage(req, res) {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        error: 'Os campos "to" e "message" são obrigatórios.',
      });
    }

    try {
      const data = {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      };

      const headers = {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      };

      const response = await sendHttpsRequest(API_URL, "POST", data, headers);

      res.status(200).json({
        message: "Mensagem de texto enviada com sucesso!",
        data: response,
      });
    } catch (error) {
      console.log(error);

      console.error("Erro ao enviar mensagem de texto:", error.message);
      res.status(500).json({
        error: "Erro ao enviar a mensagem de texto.",
        details: error.message,
      });
    }
  }
}

module.exports = ChatBot_Controller;
