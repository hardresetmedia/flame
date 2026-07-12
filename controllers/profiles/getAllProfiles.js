const asyncWrapper = require('../../middleware/asyncWrapper');
const Profile = require('../../models/Profile');

// @desc      Get all profiles, in rule-evaluation precedence order
// @route     GET /api/profiles
// @access    Public — rules are evaluated client-side before login.
//            Accepted trade-off (single-user instance): profile names and
//            rule conditions are visible to anonymous visitors.
const getAllProfiles = asyncWrapper(async (req, res, next) => {
  const profiles = await Profile.findAll({
    order: [
      ['orderId', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  res.status(200).json({
    success: true,
    data: profiles,
  });
});

module.exports = getAllProfiles;
