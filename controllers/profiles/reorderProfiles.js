const asyncWrapper = require('../../middleware/asyncWrapper');
const ErrorResponse = require('../../utils/ErrorResponse');
const Profile = require('../../models/Profile');

// @desc      Reorder profiles (order doubles as rule-evaluation precedence)
// @route     PUT /api/profiles/0/reorder
// @access    Private
const reorderProfiles = asyncWrapper(async (req, res, next) => {
  if (!Array.isArray(req.body.profiles)) {
    return next(new ErrorResponse('profiles must be an array', 400));
  }

  // awaited sequentially (unlike the older reorder endpoints) so the
  // response only returns once the new order is actually persisted
  for (const { id, orderId } of req.body.profiles) {
    await Profile.update({ orderId }, { where: { id } });
  }

  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = reorderProfiles;
