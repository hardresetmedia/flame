const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const App = sequelize.define(
  'App',
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'cancel',
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
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    // Profile assignment (array of profile ids); [] = visible in every
    // profile. See db/migrations/06_profiles.js.
    profileIds: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    tableName: 'apps',
  }
);

module.exports = App;
