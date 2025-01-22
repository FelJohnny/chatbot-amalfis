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

      // Relacionamento com Mensagens (para rastrear o histórico)
      // ChatbotResposta.hasMany(models.ChatbotMensagem, {
      //   foreignKey: "resposta_id",
      //   as: "mensagens",
      // });
    }
  }

  ChatbotResposta.init(
    {
      mensagem: DataTypes.TEXT,
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      respostas_possiveis: DataTypes.JSONB, // Mapeia opções de resposta para IDs de perguntas
      resposta_padrao: DataTypes.INTEGER, // ID da resposta padrão se nenhuma opção corresponder
      tipo: {
        type: DataTypes.STRING,
        defaultValue: "texto",
      },
      opcoes: DataTypes.JSONB, // Configuração de botões (se aplicável)
    },
    {
      sequelize,
      modelName: "ChatbotResposta",
      tableName: "chatbot_respostas",
    }
  );

  return ChatbotResposta;
};
