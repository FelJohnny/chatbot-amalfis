const { amalfisCli } = require("../models/index.js");
const { Op } = require("sequelize");
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const API_URL = process.env.API_URL;
const https = require("https");

class ChatBot_Services {
  // Verifica se uma mensagem já foi processada
  async mensagemJaProcessada(sessaoId, clienteId, conteudoMessage) {
    const mensagemExistente = await amalfisCli.ChatbotMensagem.findOne({
      where: {
        sessao_id: sessaoId,
        cliente_id: clienteId,
        conteudo_message: conteudoMessage,
      },
    });

    return !!mensagemExistente; // Retorna true se a mensagem já existir
  }

  // Função genérica para enviar requisições HTTPS
  async sendHttpsRequest(url, method, data, headers) {
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
  }

  // Busca ou cria cliente
  async buscaOuCriaCliente(numContato) {
    let cliente = await amalfisCli.ChatbotCliente.findOne({
      where: { numero_contato: numContato },
    });

    if (!cliente) {
      cliente = await amalfisCli.ChatbotCliente.create({
        numero_contato: numContato,
        nome: null,
        cnpj: null,
        empresa: null,
        qtde_colaborador: null,
        local_emp: null,
      });
      console.log("Novo cliente criado");
    } else {
      console.log("Cliente encontrado");
    }

    return { status: true, retorno: cliente };
  }

  // Busca ou cria sessão
  async buscaOuCriaSessao(clienteId) {
    let sessao = await amalfisCli.ChatbotSessao.findOne({
      where: { cliente_id: clienteId, status: true },
    });

    if (!sessao) {
      sessao = await amalfisCli.ChatbotSessao.create({
        cliente_id: clienteId,
        atendente_id: null,
        status: true,
      });
      console.log("Nova sessão criada");
    }

    return sessao;
  }

  // Registra mensagem no histórico
  async registraMensagem(
    sessaoId,
    clienteId,
    respostaId,
    conteudoMessage,
    atendenteId = null
  ) {
    if (!sessaoId || !clienteId || !conteudoMessage) {
      throw new Error(
        "Sessão, cliente e conteúdo da mensagem são obrigatórios."
      );
    }

    try {
      const mensagem = await amalfisCli.ChatbotMensagem.create({
        sessao_id: sessaoId,
        cliente_id: clienteId,
        resposta_id: respostaId || null, // Permite que resposta_id seja nulo
        conteudo_message: conteudoMessage,
        atendente_id: atendenteId,
      });
      console.log("Mensagem registrada com sucesso");
      return mensagem;
    } catch (error) {
      console.error("Erro ao registrar mensagem:", error.message);
      throw error;
    }
  }

  // Recupera última mensagem do chatbot
  async recuperaUltimaMensagemChatbot(clienteId, sessaoId) {
    const ultimaMensagem = await amalfisCli.ChatbotMensagem.findOne({
      where: {
        cliente_id: clienteId,
        sessao_id: sessaoId,
        resposta_id: { [Op.ne]: null },
      },
      order: [["createdAt", "DESC"]],
    });

    return ultimaMensagem;
  }

  // Busca resposta por ID
  async buscaRespostaCliente(idResposta) {
    const resposta = await amalfisCli.ChatbotResposta.findOne({
      where: { id: idResposta },
    });
    if (!resposta) {
      console.log("Resposta não encontrada");
      return null;
    } else {
      console.log("Resposta encontrada");
      return resposta;
    }
  }

  // Busca a próxima resposta com base nas respostas possíveis ou padrão
  async buscaProximaResposta(idResposta, respostaUsuario) {
    if (!idResposta) {
      console.error("ID da resposta atual é inválido.");
      return null;
    }

    const resposta = await amalfisCli.ChatbotResposta.findOne({
      where: { id: idResposta },
    });

    if (!resposta) {
      console.error("Resposta atual não encontrada");
      return null;
    }

    const respostasPossiveis = resposta.respostas_possiveis || {};
    const proximaRespostaId =
      respostasPossiveis[respostaUsuario] || resposta.resposta_padrao;

    if (proximaRespostaId) {
      const proximaResposta = await amalfisCli.ChatbotResposta.findOne({
        where: { id: proximaRespostaId },
      });

      if (proximaResposta) {
        console.log("Próxima resposta encontrada");
        return proximaResposta;
      } else {
        console.error("Próxima resposta não encontrada");
        return null;
      }
    } else {
      console.error("Nenhuma próxima resposta configurada");
      return null;
    }
  }

  // Envia mensagem via WhatsApp
  async respondeWhatsApp(to, message, type) {
    // Verifica se é texto ou mensagem interativa
    console.log(message);
    console.log(message);
    console.log(message);

    const msg =
      typeof message === "string" ? message.replace(/\\n/g, "\n") : message;

    // if (!msg) {
    //   console.error("A mensagem não pode ser vazia.");
    //   throw new Error("A mensagem enviada ao WhatsApp está vazia ou inválida.");
    // }

    try {
      const data = {
        messaging_product: "whatsapp",
        to,
        type: type,
        ...(type === "text" ? { text: { body: msg } } : { ...message }),
      };

      const headers = {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      };

      const response = await this.sendHttpsRequest(
        API_URL,
        "POST",
        data,
        headers
      );

      console.log({
        message: "Mensagem respondida com sucesso!",
        data: response,
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem via WhatsApp:", error.message);
    }
  }

  // Processa tipo de mensagem (texto, botão, lista)
  async processaMensagem(tipo, mensagem, opcoes) {
    if (tipo === "texto") {
      return { text: { body: mensagem.text.body } };
    } else if (tipo === "button") {
      const botoes = opcoes.map((opcao) => ({
        type: "reply",
        reply: { id: opcao.value, title: opcao.label },
      }));

      return {
        interactive: {
          type: "button",
          body: { text: mensagem },
          action: { buttons: botoes },
        },
      };
    } else if (tipo === "list") {
      const listaItens = opcoes.map((opcao) => ({
        id: opcao.value,
        title: opcao.label,
        description: opcao.description || "",
      }));

      return {
        interactive: {
          type: "list",
          header: { type: "text", text: mensagem },
          body: { text: "Selecione uma das opções abaixo:" },
          footer: { text: "Escolha com sabedoria!" },
          action: {
            button: "Ver opções",
            sections: [{ title: "Opções disponíveis", rows: listaItens }],
          },
        },
      };
    } else {
      throw new Error("Tipo de mensagem não suportado.");
    }
  }

  // Extrai o corpo da mensagem recebida
  async getMessageBody(message) {
    return (
      message.text?.body?.toLowerCase().trim() || // Texto simples
      message.button?.text?.toLowerCase().trim() || // Botões interativos
      message.interactive?.button_reply?.id || // Botão com ID
      message.interactive?.list_reply?.id || // Lista com ID
      ""
    );
  }
}

module.exports = ChatBot_Services;

module.exports = ChatBot_Services;
