const { amalfisCli } = require("../models/index.js");
const { Op } = require("sequelize");
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const API_URL = process.env.API_URL;
const https = require("https");
const fetch = require("node-fetch");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = process.env.GEMINI_API_URL


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

  async atulizaRegistroCliente(value, column, clienteId) {
    const [rowsAtualizada] = await amalfisCli.ChatbotCliente.update(
      {
        [column]: value,
      },
      {
        where: {
          id: clienteId,
        },
      }
    );

    if (rowsAtualizada > 0) {
      console.log("Registro atualizado com sucesso");
      return rowsAtualizada;
    } else {
      console.log("Nenhum registro foi atualizada");
    }
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

  // Recupera última mensagem do cliente

  async buscaUltimaMensagemCliente(clienteId, sessaoId) {
    const mensagemCli = await amalfisCli.ChatbotMensagem.findOne({
      where: {
        cliente_id: clienteId,
        sessao_id: sessaoId,
        resposta_id: { [Op.eq]: null },
      },
      order: [["createdAt", "DESC"]],
    });
    return mensagemCli;
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

    try {
      const data = {
        messaging_product: "whatsapp",
        to,
        type: type,
        ...(type === "text" ? { text: { body: message } } : { ...message }),
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
  async processaMensagem(tipo, mensagem, opcoes, idCliente) {
    const validaNomeCli = mensagem.includes("{nome_cli}");
    
    let nomeCli;
    if (validaNomeCli) {
      const cliente = await amalfisCli.ChatbotCliente.findOne({
        where: { id: idCliente },
      });
      nomeCli = cliente.nome;
    }

    const msg = mensagem.replace(/\\n/g, "\n").replace("{nome_cli}", nomeCli);

    if (tipo === "texto") {
      return msg;
    } else if (tipo === "button") {
      const botoes = opcoes.map((opcao) => ({
        type: "reply",
        reply: { id: opcao.value, title: opcao.label },
      }));

      return {
        interactive: {
          type: "button",
          body: { text: msg },
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
          //header: { type: "text", text: "" },
          body: { text: msg },
          footer: { text: "Escolha uma opção abaixo" },
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

  async enviaMensagemComIA(message) {
    try {
      const payload = {
        contents: [
          {
            role: "user", // Mensagem inicial do usuário
            parts: [{ text: "Você é um assistente especializado em tecnologia. Responda de forma técnica e objetiva." }]
          },
          {
            role: "user", // Mensagem real do usuário
            parts: [{ text: message }]
          }
        ]
      };
  
      const response = await fetch(GEMINI_API_URL+GEMINI_API_KEY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
  
      if (data && data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text; // Retorna a resposta gerada pela IA
      } else {
        throw new Error("Nenhuma resposta gerada pela IA.");
      }
    } catch (error) {
      console.error("Erro ao chamar a API do Gemini:", error);
      return "Desculpe, não consegui processar sua solicitação no momento.";
    }
  }
  


}

module.exports = ChatBot_Services;
