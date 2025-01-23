"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ChatbotMensagem extends Model {
    static associate(models) {
      // Relacionamento com Atendente
      ChatbotMensagem.belongsTo(models.ChatbotAtendente, {
        foreignKey: "atendente_id",
        as: "atendente",
      });

      // Relacionamento com Cliente
      ChatbotMensagem.belongsTo(models.ChatbotCliente, {
        foreignKey: "cliente_id",
        as: "cliente",
      });

      // Relacionamento com Sessao
      ChatbotMensagem.belongsTo(models.ChatbotSessao, {
        foreignKey: "sessao_id",
        as: "sessao",
      });

      // Relacionamento com Respostas do Chatbot (para rastrear qual pergunta gerou esta mensagem)
      ChatbotMensagem.belongsTo(models.ChatbotResposta, {
        foreignKey: "resposta_id",
        as: "resposta",
      });
    }
  }

  ChatbotMensagem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Gera automaticamente um UUID
        primaryKey: true,
        allowNull: false,
      },
      conteudo_message: {
        type: DataTypes.TEXT, // Permite mensagens longas
        allowNull: false,
      },
      resposta_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Pode ser nulo para mensagens que não estão vinculadas a respostas
      },
    },
    {
      sequelize,
      modelName: "ChatbotMensagem",
      tableName: "chatbot_mensagems",
    }
  );

  return ChatbotMensagem;
};
