"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class usuarios_roles extends Model {
    static associate(models) {
      // Relacionamento com Usuario
      usuarios_roles.belongsTo(models.Usuario, {
        foreignKey: "usuario_id",
        as: "usuario",
      });

      // Relacionamento com Role
      usuarios_roles.belongsTo(models.Role, {
        foreignKey: "role_id",
        as: "role",
      });
    }
  }
  usuarios_roles.init(
    {
      usuario_id: DataTypes.UUID,
      role_id: DataTypes.UUID,
    },
    {
      sequelize,
      modelName: "usuarios_roles",
      tableName: "usuarios_roles",
    }
  );
  return usuarios_roles;
};
