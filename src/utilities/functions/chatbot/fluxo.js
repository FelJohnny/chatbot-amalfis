const { amalfisCli } = require("../../../models");

class Fluxo_chatBot {
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
}

module.exports = Fluxo_chatBot;
