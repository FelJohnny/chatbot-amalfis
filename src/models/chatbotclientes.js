"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ChatbotCliente extends Model {
    static associate(models) {
      // Relacionamento com Sessao
      ChatbotCliente.hasMany(models.ChatbotSessao, {
        foreignKey: "cliente_id",
        as: "sessoes",
      });

      // Relacionamento com Mensagem
      ChatbotCliente.hasMany(models.ChatbotMensagem, {
        foreignKey: "cliente_id",
        as: "mensagens",
      });
    }
  }

  ChatbotCliente.init(
    {
      numero_contato: DataTypes.STRING,
      nome: DataTypes.STRING,
      cnpj: DataTypes.STRING,
      cpf: DataTypes.STRING,
      empresa: DataTypes.STRING,
      qtde_colaborador: DataTypes.INTEGER,
      local_emp: DataTypes.STRING,
      tipo_entidade: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "ChatbotCliente",
      tableName: "chatbot_clientes",
    }
  );

  return ChatbotCliente;
};
