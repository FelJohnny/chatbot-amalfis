"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ChatbotAtendente extends Model {
    static associate(models) {
      // Relacionamento com Usuario
      ChatbotAtendente.belongsTo(models.Usuario, {
        foreignKey: "usuario_id",
        as: "usuario",
      });

      // Relacionamento com Sessao
      ChatbotAtendente.hasMany(models.ChatbotSessao, {
        foreignKey: "atendente_id",
        as: "sessoes",
      });

      // Relacionamento com Avaliacao
      ChatbotAtendente.hasMany(models.ChatbotAvaliacao, {
        foreignKey: "atendente_id",
        as: "avaliacoes",
      });

      // Relacionamento com Mensagem
      ChatbotAtendente.hasMany(models.ChatbotMensagem, {
        foreignKey: "atendente_id",
        as: "mensagens",
      });
    }
  }

  ChatbotAtendente.init(
    {
      nome_view: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "ChatbotAtendente",
      tableName: "chatbot_atendentes",
    }
  );

  return ChatbotAtendente;
};
