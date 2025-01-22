class Fluxo_chatBot {
  async buscaClientePorNumeroContato(numContato) {
    const cliente = await amalfisCli.ChatbotCliente.findOne({
      where: { numero_contato: numContato },
    });
    return cliente;
  }
}

module.exports = Fluxo_chatBot;
