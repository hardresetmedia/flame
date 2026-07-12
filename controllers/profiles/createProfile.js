const asyncWrapper = require('../../middleware/asyncWrapper');
const ErrorResponse = require('../../utils/ErrorResponse');
const Profile = require('../../models/Profile');
const validateProfileBody = require('./profileValidation');

// @desc      Create new profile
// @route     POST /api/profiles
// @access    Private
const createProfile = asyncWrapper(async (req, res, next) => {
  const { error, value } = validateProfileBody(req.body);

  if (error) {
    return next(new ErrorResponse(error, 400));
  }

  const existing = await Profile.findOne({ where: { name: value.name } });

  if (existing) {
    return next(new ErrorResponse(`Profile '${value.name}' already exists`, 400));
  }

  // keep at most one default profile
  if (value.isDefault) {
    await Profile.update({ isDefault: false }, { where: {} });
  }

  // append to the end of the precedence order unless specified
  if (value.orderId === undefined || value.orderId === null) {
    value.orderId = (await Profile.count()) + 1;
  }

  const profile = await Profile.create(value);

  res.status(201).json({
    success: true,
    data: profile,
  });
});

module.exports = createProfile;
