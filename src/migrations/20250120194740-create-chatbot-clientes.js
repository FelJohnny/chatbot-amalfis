"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("chatbot_clientes", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      numero_contato: {
        type: Sequelize.STRING,
      },
      nome: {
        type: Sequelize.STRING,
      },
      cnpj: {
        type: Sequelize.STRING,
      },
      empresa: {
        type: Sequelize.STRING,
      },
      qtde_colaborador: {
        type: Sequelize.INTEGER,
      },
      local_emp: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable("chatbot_clientes");
  },
};
