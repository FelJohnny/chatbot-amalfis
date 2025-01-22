"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("chatbot_respostas", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      mensagem: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      respostas_possiveis: {
        type: Sequelize.JSONB,
        allowNull: true, // Mapeia variações de respostas para IDs de perguntas
      },
      resposta_padrao: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "chatbot_respostas",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      tipo: {
        type: Sequelize.STRING, // Tipo da resposta (ex.: texto, botão, lista)
        allowNull: false,
        defaultValue: "texto",
      },
      opcoes: {
        type: Sequelize.JSONB, // Opções de botões ou listas
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("chatbot_respostas");
  },
};
