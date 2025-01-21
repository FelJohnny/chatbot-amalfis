"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserPermissionAccess extends Model {
    static associate(models) {
      // Relacionamento com Usuario
      UserPermissionAccess.belongsTo(models.Usuario, {
        foreignKey: "usuario_id",
        as: "usuario",
      });

      // Relacionamento com Permissao
      UserPermissionAccess.belongsTo(models.Permissao, {
        foreignKey: "permissao_id",
        as: "permissao",
      });
    }
  }

  UserPermissionAccess.init(
    {
      can_create: DataTypes.BOOLEAN,
      can_read: DataTypes.BOOLEAN,
      can_update: DataTypes.BOOLEAN,
      can_delete: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "UserPermissionAccess",
      tableName: "user_permission_access",
    }
  );

  return UserPermissionAccess;
};
