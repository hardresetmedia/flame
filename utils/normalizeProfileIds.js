// Validates/normalizes a client-supplied profileIds value for app/category
// writes. Returns:
//   undefined — field absent, leave the model value untouched
//   number[]  — de-duplicated array of integer profile ids ([] = visible in
//               every profile)
//   null      — invalid input (caller responds 400)
// Multipart requests (icon uploads) deliver the field as a JSON-encoded
// string, so strings are parsed first.
const normalizeProfileIds = (value) => {
  if (value === undefined) {
    return undefined;
  }

  let parsed = value;

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(parsed)) {
    return null;
  }

  const ids = parsed.map(Number);

  if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
    return null;
  }

  return [...new Set(ids)];
};

module.exports = normalizeProfileIds;
