"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UsuarioPermissao extends Model {
    static associate(models) {
      UsuarioPermissao.belongsTo(models.Usuario, {
        foreignKey: "usuario_id",
        as: "usuario",
      });
      UsuarioPermissao.belongsTo(models.Permissao, {
        foreignKey: "permissao_id",
        as: "permissao",
      });
    }
  }

  UsuarioPermissao.init(
    {},
    {
      sequelize,
      modelName: "UsuarioPermissao",
      tableName: "usuarios_permissoes",
    }
  );

  return UsuarioPermissao;
};
