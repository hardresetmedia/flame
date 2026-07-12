const asyncWrapper = require('../../middleware/asyncWrapper');
const ErrorResponse = require('../../utils/ErrorResponse');
const Category = require('../../models/Category');
const pick = require('../../utils/pick');
const { CATEGORY_WRITABLE_FIELDS } = require('../../utils/writableFields');
const normalizeProfileIds = require('../../utils/normalizeProfileIds');

// @desc      Update category
// @route     PUT /api/categories/:id
// @access    Public
const updateCategory = asyncWrapper(async (req, res, next) => {
  let category = await Category.findOne({
    where: { id: req.params.id },
  });

  if (!category) {
    return next(
      new ErrorResponse(
        `Category with id of ${req.params.id} was not found`,
        404
      )
    );
  }

  const body = pick(req.body, CATEGORY_WRITABLE_FIELDS);

  const profileIds = normalizeProfileIds(body.profileIds);
  if (profileIds === null) {
    return next(
      new ErrorResponse('profileIds must be an array of profile ids', 400)
    );
  } else if (profileIds !== undefined) {
    body.profileIds = profileIds;
  }

  category = await category.update(body);

  res.status(200).json({
    success: true,
    data: category,
  });
});

module.exports = updateCategory;
