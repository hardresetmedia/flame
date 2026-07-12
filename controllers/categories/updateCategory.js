const asyncWrapper = require('../../middleware/asyncWrapper');
const ErrorResponse = require('../../utils/ErrorResponse');
const Category = require('../../models/Category');
const pick = require('../../utils/pick');
const { CATEGORY_WRITABLE_FIELDS } = require('../../utils/writableFields');

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

  category = await category.update(pick(req.body, CATEGORY_WRITABLE_FIELDS));

  res.status(200).json({
    success: true,
    data: category,
  });
});

module.exports = updateCategory;
