const asyncWrapper = require('../../middleware/asyncWrapper');
const ErrorResponse = require('../../utils/ErrorResponse');
const Profile = require('../../models/Profile');
const validateProfileBody = require('./profileValidation');

// @desc      Update profile
// @route     PUT /api/profiles/:id
// @access    Private
const updateProfile = asyncWrapper(async (req, res, next) => {
  let profile = await Profile.findOne({ where: { id: req.params.id } });

  if (!profile) {
    return next(
      new ErrorResponse(
        `Profile with the id of ${req.params.id} was not found`,
        404
      )
    );
  }

  const { error, value } = validateProfileBody(req.body, { partial: true });

  if (error) {
    return next(new ErrorResponse(error, 400));
  }

  if (value.name && value.name !== profile.name) {
    const existing = await Profile.findOne({ where: { name: value.name } });

    if (existing) {
      return next(
        new ErrorResponse(`Profile '${value.name}' already exists`, 400)
      );
    }
  }

  // keep at most one default profile
  if (value.isDefault) {
    await Profile.update({ isDefault: false }, { where: {} });
  }

  profile = await profile.update(value);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

module.exports = updateProfile;
