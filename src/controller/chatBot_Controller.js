const { amalfisCli } = require("../models");
const ChatBot_Services = require("../services/chatBot_Services");

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
                // 1. Identifica o número do cliente e o tipo de mensagem
                const from = message.from || "número não identificado"; // Número do cliente
                const messageType = message.type || "tipo não identificado"; // Tipo da mensagem recebida
                const messageBody =
                  message.text?.body?.toLowerCase().trim() || ""; // Corpo da mensagem (se texto)

                // 2. Busca o cliente pelo número de contato
                let cliente = await amalfisCli.ChatbotCliente.findOne({
                  where: { numero_contato: from },
                });

                if (!cliente) {
                  // Cria um novo cliente se ele não existir
                  cliente = await amalfisCli.ChatbotCliente.create({
                    numero_contato: from,
                    nome: null,
                    cnpj: null,
                    empresa: null,
                    qtde_colaborador: null,
                    local_emp: null,
                  });
                }

                // 3. Verifica se existe uma sessão ativa para o cliente
                let sessao = await amalfisCli.ChatbotSessao.findOne({
                  where: { cliente_id: cliente.id, status: true },
                });

                if (!sessao) {
                  // Cria uma nova sessão se nenhuma estiver ativa
                  sessao = await amalfisCli.ChatbotSessao.create({
                    cliente_id: cliente.id,
                    atendente_id: null, // Sem atendente inicialmente
                    status: true, // Sessão ativa
                  });
                }

                // 4. Recupera a última mensagem enviada pelo chatbot na sessão
                const ultimaMensagem = await chatbot_mensagems.findOne({
                  where: {
                    cliente_id: cliente.id,
                    sessao_id: sessao.id,
                  },
                  order: [["createdAt", "DESC"]],
                });

                let proximaPerguntaId;

                if (ultimaMensagem) {
                  // 5. Recupera a pergunta associada à última mensagem enviada
                  const respostaAnterior = await chatbot_respostas.findByPk(
                    ultimaMensagem.resposta_id
                  );

                  if (respostaAnterior) {
                    // Determina a próxima pergunta com base nas respostas possíveis
                    const respostasPossiveis =
                      respostaAnterior.respostas_possiveis || {};
                    proximaPerguntaId =
                      respostasPossiveis[messageBody] ||
                      respostaAnterior.resposta_padrao;
                  }
                } else {
                  // 6. Caso seja a primeira interação, inicia com a primeira pergunta
                  proximaPerguntaId = 1; // ID inicial configurado
                }

                if (proximaPerguntaId) {
                  // 7. Busca a próxima pergunta e envia ao cliente
                  const proximaPergunta = await chatbot_respostas.findByPk(
                    proximaPerguntaId
                  );

                  if (proximaPergunta) {
                    // Envia a próxima pergunta
                    await chatbot_services.respondeWhatsApp(
                      from,
                      proximaPergunta.mensagem,
                      "text"
                    );

                    // Registra a mensagem enviada na tabela de mensagens
                    await chatbot_mensagems.create({
                      atendente_id: null, // Mensagem enviada pelo chatbot
                      cliente_id: cliente.id,
                      sessao_id: sessao.id,
                      conteudo_message: proximaPergunta.mensagem,
                      resposta_id: proximaPergunta.id, // Relaciona com a resposta enviada
                    });
                  } else {
                    console.error(
                      `Pergunta com ID ${proximaPerguntaId} não encontrada.`
                    );
                  }
                } else {
                  // 8. Caso não haja próxima pergunta configurada
                  await chatbot_services.respondeWhatsApp(
                    from,
                    "Desculpe, não consegui entender sua solicitação.",
                    "text"
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
