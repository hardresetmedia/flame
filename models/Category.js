const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Category = sequelize.define(
  'Category',
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    isPublic: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    // Profile assignment (array of profile ids); [] = visible in every
    // profile. Bookmarks inherit their category's assignment.
    profileIds: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    tableName: 'categories',
  }
);

module.exports = Category;
