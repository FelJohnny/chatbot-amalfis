"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ChatbotSessao extends Model {
    static associate(models) {
      // Relacionamento com Cliente
      ChatbotSessao.belongsTo(models.ChatbotCliente, {
        foreignKey: "cliente_id",
        as: "cliente",
      });

      // Relacionamento com Atendente
      ChatbotSessao.belongsTo(models.ChatbotAtendente, {
        foreignKey: "atendente_id",
        as: "atendente",
      });

      // Relacionamento com Mensagem
      ChatbotSessao.hasMany(models.ChatbotMensagem, {
        foreignKey: "sessao_id",
        as: "mensagens",
      });

      // Relacionamento com Avaliacao
      ChatbotSessao.hasMany(models.ChatbotAvaliacao, {
        foreignKey: "sessao_id",
        as: "avaliacoes",
      });
    }
  }

  ChatbotSessao.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      cliente_id: DataTypes.INTEGER,
      atendente_id: DataTypes.UUID,
      status: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "ChatbotSessao",
      tableName: "chatbot_sessaos",
    }
  );

  return ChatbotSessao;
};
