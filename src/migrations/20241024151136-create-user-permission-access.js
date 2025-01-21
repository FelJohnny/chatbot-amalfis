"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_permission_access", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      usuario_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "usuarios",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      permissao_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "permissoes",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      can_create: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      can_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      can_update: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      can_delete: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.dropTable("user_permission_access");
  },
};
