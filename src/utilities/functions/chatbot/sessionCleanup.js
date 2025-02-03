const { amalfisCli } = require("../../../models/index.js");
const { Op } = require("sequelize");
const ChatBot_Services = require("../../../services/chatBot_Services");

const chatbot_services = new ChatBot_Services();

// Tempo limite de inatividade (15 minutos)
const TEMPO_LIMITE_INATIVIDADE = 1 * 60 * 1000;

async function encerrarSessoesInativas() {
  try {
    const agora = new Date();
    const limite = new Date(agora - TEMPO_LIMITE_INATIVIDADE);

    // Busca sessões ativas onde a última atualização foi há mais de 15 minutos
    const sessoesInativas = await amalfisCli.ChatbotSessao.findAll({
      where: {
        status: true, // Apenas sessões ativas
        updatedAt: { [Op.lt]: limite }, // Inativas há mais tempo que o limite
      },
      include: [{ model: amalfisCli.ChatbotCliente, as: "cliente" }], // Inclui info do cliente
    });

    if (sessoesInativas.length === 0) {
      console.log("Nenhuma sessão inativa encontrada.");
      return;
    }

    // Encerrar sessões inativas
    for (const sessao of sessoesInativas) {
      if (!sessao.cliente) continue; // Se não houver cliente associado, pula

      const numeroCliente = sessao.cliente.numero_contato;

      // Mensagem de encerramento
      const mensagemEncerramento =
        "Seu atendimento foi encerrado por inatividade. Caso precise de mais ajuda, envie uma nova mensagem.";

      // Envia mensagem de encerramento
      await chatbot_services.respondeWhatsApp(
        numeroCliente,
        mensagemEncerramento,
        "text"
      );

      // Encerra a sessão
      await sessao.update({ status: false });

      console.log(
        `Sessão ${sessao.id} encerrada e notificação enviada para ${numeroCliente}.`
      );
    }
  } catch (error) {
    console.error("Erro ao encerrar sessões inativas:", error.message);
  }
}

// Executar essa função a cada 5 minutos
setInterval(encerrarSessoesInativas, 1 * 60 * 1000);

module.exports = encerrarSessoesInativas;
