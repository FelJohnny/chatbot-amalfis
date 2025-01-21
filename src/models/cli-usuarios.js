"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    static associate(models) {
      // Relacionamento com Role (Muitos para Muitos)
      Usuario.belongsToMany(models.Role, {
        through: models.usuarios_roles,
        as: "usuario_roles",
        foreignKey: "usuario_id",
      });

      // Relacionamento com Permissao (Muitos para Muitos)
      Usuario.belongsToMany(models.Permissao, {
        through: models.UsuarioPermissao,
        as: "usuario_permissoes",
        foreignKey: "usuario_id",
      });

      // Relacionamento com UserPermissionAccess (Um para Muitos)
      Usuario.hasMany(models.UserPermissionAccess, {
        foreignKey: "usuario_id",
        as: "user_permissions_access",
      });

      // Relacionamento com Empresa (Muitos para Muitos)
      Usuario.belongsToMany(models.Empresa, {
        through: models.Usuario_Empresa,
        as: "empresas",
        foreignKey: "usuario_id",
      });

      // Relacionamento com Sessao do Chatbot (Um para Muitos)
      Usuario.hasMany(models.ChatbotSessao, {
        foreignKey: "usuario_id",
        as: "sessoes",
      });
    }
  }

  Usuario.init(
    {
      nome: DataTypes.STRING,
      email: DataTypes.STRING,
      senha: DataTypes.STRING,
      contato: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Usuario",
      tableName: "usuarios",
      defaultScope: {
        attributes: {
          exclude: ["senha"], // Exclui a senha do escopo padrão para segurança
        },
      },
    }
  );

  return Usuario;
};
