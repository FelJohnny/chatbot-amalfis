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
                const messageBody =
                  message.text?.body?.toLowerCase().trim() || "";

                // 1. Busca ou cria o cliente
                let cliente = await amalfisCli.ChatbotCliente.findOne({
                  where: { numero_contato: from },
                });

                if (!cliente) {
                  cliente = await amalfisCli.ChatbotCliente.create({
                    numero_contato: from,
                    nome: null,
                    cnpj: null,
                    empresa: null,
                    qtde_colaborador: null,
                    local_emp: null,
                  });
                }

                // 2. Busca ou cria a sessão
                let sessao = await amalfisCli.ChatbotSessao.findOne({
                  where: { cliente_id: cliente.id, status: true },
                });

                if (!sessao) {
                  sessao = await amalfisCli.ChatbotSessao.create({
                    cliente_id: cliente.id,
                    atendente_id: null,
                    status: true,
                  });
                }

                // 3. Recupera a última mensagem
                const ultimaMensagem = await amalfisCli.ChatbotMensagem.findOne(
                  {
                    where: { cliente_id: cliente.id, sessao_id: sessao.id },
                    order: [["createdAt", "DESC"]],
                  }
                );

                let proximaPerguntaId;

                if (ultimaMensagem) {
                  // Recupera a próxima pergunta
                  const respostaAnterior =
                    await amalfisCli.ChatbotResposta.findByPk(
                      ultimaMensagem.resposta_id
                    );

                  if (respostaAnterior) {
                    const respostasPossiveis =
                      respostaAnterior.respostas_possiveis || {};
                    proximaPerguntaId =
                      respostasPossiveis[messageBody] ||
                      respostaAnterior.resposta_padrao;
                  }
                } else {
                  // Primeira interação
                  proximaPerguntaId = 1;
                }

                if (proximaPerguntaId) {
                  // Busca a próxima pergunta
                  const proximaPergunta =
                    await amalfisCli.ChatbotResposta.findByPk(
                      proximaPerguntaId
                    );

                  if (proximaPergunta) {
                    const mensagemFormatada = proximaPergunta.mensagem.replace(
                      /\n/g,
                      "\\n"
                    );
                    console.log(mensagemFormatada);

                    // Envia a próxima pergunta
                    await chatbot_services.respondeWhatsApp(
                      from,
                      // proximaPergunta.mensagem,
                      mensagemFormatada,
                      "text"
                    );

                    // Registra a mensagem enviada
                    await amalfisCli.ChatbotMensagem.create({
                      id: uuidv4(), // Gera um UUID válido usando uuidv4
                      cliente_id: cliente.id,
                      sessao_id: sessao.id,
                      conteudo_message: proximaPergunta.mensagem,
                      resposta_id: proximaPergunta.id,
                    });
                  } else {
                    console.error(
                      `Próxima pergunta com ID ${proximaPerguntaId} não encontrada.`
                    );
                    break; // Finaliza o loop se não encontrar a próxima pergunta
                  }
                } else {
                  // Fim do fluxo
                  console.log(
                    "Nenhuma próxima pergunta configurada. Finalizando interação."
                  );
                  break;
                }
              }
            }
          }
        }
      }

      res.sendStatus(200);
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
