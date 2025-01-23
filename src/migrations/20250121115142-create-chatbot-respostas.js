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
        allowNull: false, // Mensagem é obrigatória
      },
      status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true, // Ativa por padrão
      },
      respostas_possiveis: {
        type: Sequelize.JSONB, // Respostas possíveis mapeadas para IDs
        allowNull: true,
      },
      resposta_padrao: {
        type: Sequelize.INTEGER, // ID da resposta padrão
        allowNull: true,
        references: {
          model: "chatbot_respostas", // Referencia a si mesma
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      tipo: {
        type: Sequelize.STRING, // Tipo da resposta (texto, botão, lista, etc.)
        allowNull: false,
        defaultValue: "texto",
      },
      opcoes: {
        type: Sequelize.JSONB, // Configuração de botões ou listas
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
