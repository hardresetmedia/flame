const asyncWrapper = require('../../middleware/asyncWrapper');
const ErrorResponse = require('../../utils/ErrorResponse');
const Profile = require('../../models/Profile');
const App = require('../../models/App');
const Category = require('../../models/Category');

// Remove the deleted profile id from a model's profileIds JSON arrays.
// Required for correctness, not just hygiene: a dangling id would keep an
// item's assignment array non-empty and thus hide it from every profile.
const scrubProfileId = async (Model, profileId) => {
  const rows = await Model.findAll();

  for (const row of rows) {
    const ids = Array.isArray(row.profileIds) ? row.profileIds : [];

    if (ids.includes(profileId)) {
      await row.update({ profileIds: ids.filter((id) => id !== profileId) });
    }
  }
};

// @desc      Delete profile (and scrub its id from all assignments)
// @route     DELETE /api/profiles/:id
// @access    Private
const deleteProfile = asyncWrapper(async (req, res, next) => {
  const profileId = parseInt(req.params.id, 10);

  const profile = await Profile.findOne({ where: { id: profileId } });

  if (!profile) {
    return next(
      new ErrorResponse(
        `Profile with the id of ${req.params.id} was not found`,
        404
      )
    );
  }

  await scrubProfileId(App, profileId);
  await scrubProfileId(Category, profileId);

  await Profile.destroy({ where: { id: profileId } });

  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = deleteProfile;
