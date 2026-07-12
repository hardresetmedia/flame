// Explicit allow-lists of the model fields clients may set through the API.
// Used with utils/pick.js in the create/update controllers; anything not
// listed here (ids, timestamps, unknown keys) is silently dropped.
// Note: apps' isPinned is still overridden by pinAppsByDefault on create.
const APP_WRITABLE_FIELDS = [
  'name',
  'url',
  'icon',
  'description',
  'isPublic',
  'isPinned',
  'orderId',
];

const BOOKMARK_WRITABLE_FIELDS = [
  'name',
  'url',
  'categoryId',
  'icon',
  'isPublic',
  'orderId',
];

const CATEGORY_WRITABLE_FIELDS = ['name', 'isPinned', 'isPublic', 'orderId'];

module.exports = {
  APP_WRITABLE_FIELDS,
  BOOKMARK_WRITABLE_FIELDS,
  CATEGORY_WRITABLE_FIELDS,
};
