const { amalfisCli } = require("../models/index.js");
const { Op } = require("sequelize");
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const API_URL = process.env.API_URL;
const https = require("https");

class ChatBot_Services {
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
    let cliente = await this.buscaClientePorNumeroContato(numContato);
    if (!cliente.status) {
      cliente = {
        status: true,
        retorno: await this.criaCliente(numContato),
      };
      console.log("Novo cliente criado");
    }
    return cliente;
  }

  // Busca cliente por número de contato
  async buscaClientePorNumeroContato(numContato) {
    const cliente = await amalfisCli.ChatbotCliente.findOne({
      where: { numero_contato: numContato },
    });
    if (!cliente) {
      console.log("Cliente não encontrado");
      return { status: false, retorno: null };
    } else {
      console.log("Cliente encontrado");
      return { status: true, retorno: cliente };
    }
  }

  // Cria novo cliente
  async criaCliente(numeroContato) {
    const cliente = await amalfisCli.ChatbotCliente.create({
      numero_contato: numeroContato,
      nome: null,
      cnpj: null,
      empresa: null,
      qtde_colaborador: null,
      local_emp: null,
    });
    return cliente;
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
    const mensagem = await amalfisCli.ChatbotMensagem.create({
      sessao_id: sessaoId,
      cliente_id: clienteId,
      resposta_id: respostaId || null,
      conteudo_message: conteudoMessage,
      atendente_id: atendenteId,
    });
    return mensagem;
  }

  // Recupera última mensagem do chatbot
  async recuperaUltimaMensagemChatbot(clienteId, sessaoId) {
    const ultimaMensagem = await amalfisCli.ChatbotMensagem.findOne({
      where: {
        cliente_id: clienteId,
        sessao_id: sessaoId,
        resposta_id: { [Op.ne]: null }, //Recupera registros onde o valor da coluna é diferente de null
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
    return resposta;
  }

  // Busca a próxima resposta com base nas respostas possíveis ou padrão
  async buscaProximaResposta(idResposta, respostaUsuario) {
    const resposta = await this.buscaRespostaCliente(idResposta);

    const respostasPossiveis = resposta.respostas_possiveis || {};
    const proximaRespostaId =
      respostasPossiveis[respostaUsuario] || resposta.resposta_padrao;

    if (proximaRespostaId) {
      return await this.buscaRespostaCliente(proximaRespostaId);
    }
    return null;
  }

  // Envia mensagem via WhatsApp
  async respondeWhatsApp(to, message, type) {
    const data = {
      messaging_product: "whatsapp",
      to,
      type,
      ...(type === "text" ? { text: { body: message } } : { ...message }),
    };

    const headers = {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    };

    await this.sendHttpsRequest(API_URL, "POST", data, headers);
  }

  // Processa mensagem (texto, botão, lista)
  async processaMensagem(tipo, mensagem, opcoes) {
    if (tipo === "texto") {
      return { text: { body: mensagem } };
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
    }
    throw new Error("Tipo de mensagem não suportado.");
  }

  // Extrai corpo da mensagem (getMessageBody)
  async getMessageBody(message) {
    return (
      message.text?.body?.toLowerCase().trim() ||
      message.button?.text?.toLowerCase().trim() ||
      message.interactive?.button_reply?.id ||
      message.interactive?.list_reply?.id ||
      ""
    );
  }
}

module.exports = ChatBot_Services;
