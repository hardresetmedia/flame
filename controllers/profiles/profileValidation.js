// Shared payload sanitizer for profile create/update. Returns
// { error } (message for a 400) or { value } — the allow-listed, normalized
// payload safe to persist. Rules are only shape-checked here; full rule
// evaluation is client-side (client/src/utility/rulesEngine.ts).
const pick = require('../../utils/pick');
const { OVERRIDABLE_CONFIG_KEYS } = require('../../utils/configKeys');
const { PROFILE_WRITABLE_FIELDS } = require('../../utils/writableFields');

// The name doubles as the #!/name URL fragment
const NAME_PATTERN = /^[a-z0-9_-]+$/i;

const validateProfileBody = (rawBody, { partial = false } = {}) => {
  const body = pick(rawBody, PROFILE_WRITABLE_FIELDS);

  if (!partial || body.name !== undefined) {
    if (typeof body.name !== 'string' || !NAME_PATTERN.test(body.name)) {
      return {
        error:
          "name is required and may only contain letters, digits, '-' and '_' (it becomes the #!/name URL)",
      };
    }
    body.name = body.name.toLowerCase();
  }

  if (body.overrides !== undefined && body.overrides !== null) {
    if (typeof body.overrides !== 'object' || Array.isArray(body.overrides)) {
      return { error: 'overrides must be an object of config overrides' };
    }
    body.overrides = pick(body.overrides, OVERRIDABLE_CONFIG_KEYS);
  }

  if (body.rules !== undefined && !Array.isArray(body.rules)) {
    return { error: 'rules must be an array' };
  }

  if (
    body.theme !== undefined &&
    body.theme !== null &&
    typeof body.theme !== 'string'
  ) {
    return { error: 'theme must be a theme name (string) or null' };
  }

  if (body.isDefault !== undefined) {
    body.isDefault = Boolean(body.isDefault);
  }

  if (
    body.orderId !== undefined &&
    body.orderId !== null &&
    !Number.isInteger(Number(body.orderId))
  ) {
    return { error: 'orderId must be an integer' };
  }

  return { value: body };
};

module.exports = validateProfileBody;
