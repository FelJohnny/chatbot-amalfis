"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ChatbotAvaliacao extends Model {
    static associate(models) {
      // Relacionamento com Atendente
      ChatbotAvaliacao.belongsTo(models.ChatbotAtendente, {
        foreignKey: "atendente_id",
        as: "atendente",
      });

      // Relacionamento com Cliente
      ChatbotAvaliacao.belongsTo(models.ChatbotCliente, {
        foreignKey: "cliente_id",
        as: "cliente",
      });

      // Relacionamento com Sessao
      ChatbotAvaliacao.belongsTo(models.ChatbotSessao, {
        foreignKey: "sessao_id",
        as: "sessao",
      });
    }
  }

  ChatbotAvaliacao.init(
    {
      avaliacao: DataTypes.DOUBLE,
      comentario: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "ChatbotAvaliacao",
      tableName: "chatbot_avaliacaos",
    }
  );

  return ChatbotAvaliacao;
};
