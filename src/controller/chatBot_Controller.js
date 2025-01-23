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
                // Identifica o número do cliente e a mensagem recebida
                const from = message.from || "número não identificado";
                const messageBody =
                  message.text?.body?.toLowerCase().trim() || // Texto simples
                  message.button?.text?.toLowerCase().trim() || // Botões interativos
                  message.interactive?.button_reply?.id || // Botão com ID
                  message.interactive?.list_reply?.id || // Lista com ID
                  "";

                // 1. Busca ou cria o cliente
                let cliente =
                  await chatbot_services.buscaClientePorNumeroContato(from);
                if (!cliente.status) {
                  // Cria o cliente caso não exista
                  cliente = {
                    status: true,
                    retorno: await amalfisCli.ChatbotCliente.create({
                      numero_contato: from,
                      nome: null,
                      cnpj: null,
                      empresa: null,
                      qtde_colaborador: null,
                      local_emp: null,
                    }),
                  };
                  console.log("Novo cliente criado");
                }

                // 2. Busca ou cria a sessão
                let sessao = await amalfisCli.ChatbotSessao.findOne({
                  where: { cliente_id: cliente.retorno.id, status: true },
                });

                if (!sessao) {
                  sessao = await amalfisCli.ChatbotSessao.create({
                    cliente_id: cliente.retorno.id,
                    atendente_id: null, // Sessão sem atendente inicial
                    status: true,
                  });
                  console.log("Nova sessão criada");
                }

                // 3. Recupera a última mensagem
                const ultimaMensagem = await amalfisCli.ChatbotMensagem.findOne(
                  {
                    where: {
                      cliente_id: cliente.retorno.id,
                      sessao_id: sessao.id,
                    },
                    order: [["createdAt", "DESC"]],
                  }
                );

                let proximaPergunta;

                if (ultimaMensagem) {
                  // 4. Busca a próxima resposta com base na última mensagem
                  proximaPergunta = await chatbot_services.buscaProximaResposta(
                    ultimaMensagem.resposta_id,
                    messageBody
                  );
                } else {
                  // Primeira interação
                  proximaPergunta = await chatbot_services.buscaRespostaCliente(
                    1
                  ); // ID inicial
                }

                if (proximaPergunta) {
                  // 5. Envia a próxima mensagem de acordo com o tipo
                  if (proximaPergunta.tipo === "texto") {
                    // Mensagem de texto simples
                    await chatbot_services.respondeWhatsApp(
                      from,
                      proximaPergunta.mensagem,
                      "text"
                    );
                  } else if (proximaPergunta.tipo === "button") {
                    // Envia botões interativos
                    const botoes = proximaPergunta.opcoes.map((opcao) => ({
                      type: "reply",
                      reply: {
                        id: opcao.value,
                        title: opcao.label,
                      },
                    }));

                    await chatbot_services.respondeWhatsApp(from, {
                      type: "interactive",
                      interactive: {
                        type: "button",
                        body: {
                          text: proximaPergunta.mensagem,
                        },
                        action: {
                          buttons: botoes,
                        },
                      },
                    });
                  } else if (proximaPergunta.tipo === "list") {
                    // Envia listas interativas
                    const listaItens = proximaPergunta.opcoes.map((opcao) => ({
                      id: opcao.value,
                      title: opcao.label,
                    }));

                    await chatbot_services.respondeWhatsApp(from, {
                      type: "interactive",
                      interactive: {
                        type: "list",
                        header: {
                          type: "text",
                          text: proximaPergunta.mensagem,
                        },
                        body: {
                          text: "Selecione uma das opções abaixo:",
                        },
                        footer: {
                          text: "Escolha com sabedoria!",
                        },
                        action: {
                          sections: [
                            {
                              title: "Opções",
                              rows: listaItens,
                            },
                          ],
                        },
                      },
                    });
                  }

                  // 6. Registra a mensagem enviada
                  await chatbot_services.registraMensagem(
                    sessao.id,
                    cliente.retorno.id,
                    proximaPergunta.id,
                    proximaPergunta.mensagem
                  );
                } else {
                  console.log(
                    "Fim do fluxo ou próxima pergunta não encontrada."
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
