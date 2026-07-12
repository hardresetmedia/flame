const asyncWrapper = require('../../middleware/asyncWrapper');
const App = require('../../models/App');
const pick = require('../../utils/pick');
const { APP_WRITABLE_FIELDS } = require('../../utils/writableFields');
const normalizeProfileIds = require('../../utils/normalizeProfileIds');
const ErrorResponse = require('../../utils/ErrorResponse');

// @desc      Update app
// @route     PUT /api/apps/:id
// @access    Public
const updateApp = asyncWrapper(async (req, res, next) => {
  let app = await App.findOne({
    where: { id: req.params.id },
  });

  if (!app) {
    return next(
      new ErrorResponse(
        `App with the id of ${req.params.id} was not found`,
        404
      )
    );
  }

  let body = pick(req.body, APP_WRITABLE_FIELDS);

  const profileIds = normalizeProfileIds(body.profileIds);
  if (profileIds === null) {
    return next(
      new ErrorResponse('profileIds must be an array of profile ids', 400)
    );
  } else if (profileIds !== undefined) {
    body.profileIds = profileIds;
  }

  if (body.icon) {
    body.icon = body.icon.trim();
  }

  if (req.file) {
    body.icon = req.file.filename;
  }

  app = await app.update(body);

  res.status(200).json({
    success: true,
    data: app,
  });
});

module.exports = updateApp;
