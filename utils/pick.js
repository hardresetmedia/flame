// Returns a copy of `source` containing only the allow-listed keys that are
// actually present on it. Used by every write controller to stop mass
// assignment (spreading req.body straight into models/config files).
const pick = (source, allowedKeys) => {
  const result = {};

  if (!source || typeof source !== 'object') {
    return result;
  }

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = source[key];
    }
  }

  return result;
};

module.exports = pick;
