"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class RolePermissao extends Model {
    static associate(models) {
      RolePermissao.belongsTo(models.Role, {
        foreignKey: "role_id",
        as: "role",
      });
      RolePermissao.belongsTo(models.Permissao, {
        foreignKey: "permissao_id",
        as: "permissao",
      });
    }
  }

  RolePermissao.init(
    {},
    {
      sequelize,
      modelName: "RolePermissao",
      tableName: "roles_permissoes",
    }
  );

  return RolePermissao;
};
