"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      // Relacionamento com Usuario através de UsuarioRoles (Muitos para Muitos)
      Role.belongsToMany(models.Usuario, {
        through: models.usuarios_roles,
        foreignKey: "role_id",
        as: "usuarios",
      });

      // Relacionamento bidirecional com Permissao (Muitos para Muitos)
      Role.belongsToMany(models.Permissao, {
        through: models.RolePermissao,
        foreignKey: "role_id",
        as: "permissoes",
      });
    }
  }

  Role.init(
    {
      nome: DataTypes.STRING,
      descricao: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Role",
      tableName: "roles",
    }
  );

  return Role;
};
