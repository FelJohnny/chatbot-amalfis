'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatbotClientes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ChatbotClientes.init({
    numero_contato: DataTypes.STRING,
    nome: DataTypes.STRING,
    cnpj: DataTypes.STRING,
    empresa: DataTypes.STRING,
    qtde_colaborador: DataTypes.INTEGER,
    local_emp: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'ChatbotClientes',
  });
  return ChatbotClientes;
};