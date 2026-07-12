const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Profile = sequelize.define(
  'Profile',
  {
    // Doubles as the URL fragment (#!/name) — keep it slug-safe
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9_-]+$/i,
      },
    },
    // Activates when no hash / rule / remembered choice applies;
    // controllers keep at most one profile flagged as default
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Theme *name* resolved against the themes list at activation time;
    // null = inherit the global theme
    theme: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    // Config overrides applied client-side while the profile is active;
    // keys restricted to OVERRIDABLE_CONFIG_KEYS (utils/configKeys.js)
    overrides: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    // Auto-activation rule list evaluated client-side at boot
    // (see client/src/utility/rulesEngine.ts for the schema)
    rules: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    // Drag-order in the settings UI; doubles as rule-evaluation precedence
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'profiles',
  }
);

module.exports = Profile;
