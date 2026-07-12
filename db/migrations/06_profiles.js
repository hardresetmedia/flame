// Profiles feature: a profiles table (name is the #!/name URL fragment,
// plus optional theme / config overrides / activation rules) and JSON
// integer-array assignment columns on apps and categories. An empty
// profileIds array means "visible in every profile".
const { DataTypes } = require('sequelize');
const { STRING, BOOLEAN, INTEGER, JSON: JSONCOL, DATE } = DataTypes;

const up = async (query) => {
  await query.createTable('profiles', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: STRING,
      allowNull: false,
      unique: true,
    },
    isDefault: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    theme: {
      type: STRING,
      allowNull: true,
      defaultValue: null,
    },
    overrides: {
      type: JSONCOL,
      allowNull: true,
      defaultValue: null,
    },
    rules: {
      type: JSONCOL,
      allowNull: false,
      // Actual array, not the string '[]': Sequelize JSON-encodes the
      // default, so a string default would double-encode to '"[]"'.
      defaultValue: [],
    },
    orderId: {
      type: INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    createdAt: {
      type: DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DATE,
      allowNull: false,
    },
  });

  const profileIdsColumn = {
    type: JSONCOL,
    allowNull: false,
    // Actual array — existing rows backfill to a real [] (visible in every
    // profile), not the double-encoded string '"[]"'. See the migration
    // apply-verification in scripts/verify-migration.js --apply.
    defaultValue: [],
  };

  await query.addColumn('apps', 'profileIds', profileIdsColumn);
  await query.addColumn('categories', 'profileIds', profileIdsColumn);
};

const down = async (query) => {
  await query.removeColumn('categories', 'profileIds');
  await query.removeColumn('apps', 'profileIds');
  await query.dropTable('profiles');
};

module.exports = {
  up,
  down,
};
