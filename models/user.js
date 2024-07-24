const { Model, DataTypes } = require('sequelize');

const { sequelize } = require('../util/db');
const { truncate } = require('./blog');

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // password: {
    //   type: DataTypes.STRING(64),
    //   validate: {
    //     is: /^[0-9a-f]{64}$/i,
    //   },
    // },
  },
  {
    sequelize,
    underscored: true,
    timestamps: true,
    modelName: 'user',
  }
);

module.exports = User;
