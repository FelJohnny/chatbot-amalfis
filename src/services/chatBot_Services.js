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
    console.log("Novo cliente criado");
    return cliente;
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
    const msg =
      typeof message === "string" ? message.replace(/\\n/g, "\n") : message;

    try {
      const data = {
        messaging_product: "whatsapp",
        to,
        type: type,
        ...(type === "text" ? { text: { body: msg } } : { ...msg }),
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
}

module.exports = ChatBot_Services;
