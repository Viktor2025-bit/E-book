const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subscriber = sequelize.define('Subscriber', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  confirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'homepage',
  },
}, {
  tableName: 'Subscribers',
  timestamps: true,
});

module.exports = Subscriber;
