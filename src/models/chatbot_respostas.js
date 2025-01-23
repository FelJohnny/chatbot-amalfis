"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ChatbotResposta extends Model {
    static associate(models) {
      // Auto-relacionamento: Resposta padrão
      ChatbotResposta.belongsTo(models.ChatbotResposta, {
        foreignKey: "resposta_padrao",
        as: "respostaPadrao",
      });

      // Relacionamento com Mensagens (para rastrear histórico de interações)
      ChatbotResposta.hasMany(models.ChatbotMensagem, {
        foreignKey: "resposta_id",
        as: "mensagens",
      });
    }
  }

  ChatbotResposta.init(
    {
      mensagem: {
        type: DataTypes.TEXT,
        allowNull: false, // Mensagem da resposta
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // Ativa por padrão
      },
      respostas_possiveis: {
        type: DataTypes.JSONB, // Mapeia variações de respostas para IDs de perguntas
        allowNull: true,
      },
      resposta_padrao: {
        type: DataTypes.INTEGER, // ID da resposta padrão (fallback)
        allowNull: true,
      },
      tipo: {
        type: DataTypes.STRING, // Tipo de interação (texto, botão, lista, etc.)
        allowNull: false,
        defaultValue: "texto",
      },
      opcoes: {
        type: DataTypes.JSONB, // Configuração de botões ou listas (se aplicável)
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ChatbotResposta",
      tableName: "chatbot_respostas",
    }
  );

  return ChatbotResposta;
};
