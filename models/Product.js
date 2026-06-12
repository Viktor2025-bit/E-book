const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  handle: {
    type: DataTypes.STRING,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
  },
  imageUrl: {
    type: DataTypes.STRING,
  },
  category: {
    type: DataTypes.STRING,
  },
  author: {
    type: DataTypes.STRING,
  },
  format: {
    type: DataTypes.STRING,
    defaultValue: 'PDF',
  },
  pages: {
    type: DataTypes.INTEGER,
  },
  accessNote: {
    type: DataTypes.STRING,
    defaultValue: 'Digital access is delivered through your BEMS Books account after payment.',
  },
}, {
  timestamps: true,
});

module.exports = Product;
