"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("chatbot_mensagems", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      atendente_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "chatbot_atendentes",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "chatbot_clientes",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      sessao_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "chatbot_sessaos",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      conteudo_message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      resposta_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Pode ser nulo se for uma mensagem inicial sem vínculo
        references: {
          model: "chatbot_respostas",
          key: "id",
        },
        onDelete: "SET NULL", // Caso a resposta seja excluída
        onUpdate: "CASCADE",
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
    await queryInterface.dropTable("chatbot_mensagems");
  },
};
