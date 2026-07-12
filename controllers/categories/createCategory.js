const asyncWrapper = require('../../middleware/asyncWrapper');
const Category = require('../../models/Category');
const loadConfig = require('../../utils/loadConfig');
const pick = require('../../utils/pick');
const { CATEGORY_WRITABLE_FIELDS } = require('../../utils/writableFields');
const normalizeProfileIds = require('../../utils/normalizeProfileIds');
const ErrorResponse = require('../../utils/ErrorResponse');

// @desc      Create new category
// @route     POST /api/categories
// @access    Private
const createCategory = asyncWrapper(async (req, res, next) => {
  const { pinCategoriesByDefault: pinCategories } = await loadConfig();

  const body = pick(req.body, CATEGORY_WRITABLE_FIELDS);

  const profileIds = normalizeProfileIds(body.profileIds);
  if (profileIds === null) {
    return next(
      new ErrorResponse('profileIds must be an array of profile ids', 400)
    );
  } else if (profileIds !== undefined) {
    body.profileIds = profileIds;
  }

  const category = await Category.create({
    ...body,
    isPinned: pinCategories,
  });

  res.status(201).json({
    success: true,
    data: category,
  });
});

module.exports = createCategory;
