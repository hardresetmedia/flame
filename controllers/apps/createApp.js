const asyncWrapper = require('../../middleware/asyncWrapper');
const App = require('../../models/App');
const loadConfig = require('../../utils/loadConfig');
const pick = require('../../utils/pick');
const { APP_WRITABLE_FIELDS } = require('../../utils/writableFields');
const normalizeProfileIds = require('../../utils/normalizeProfileIds');
const ErrorResponse = require('../../utils/ErrorResponse');

// @desc      Create new app
// @route     POST /api/apps
// @access    Private
const createApp = asyncWrapper(async (req, res, next) => {
  const { pinAppsByDefault } = await loadConfig();

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

  const app = await App.create({
    ...body,
    isPinned: pinAppsByDefault,
  });

  res.status(201).json({
    success: true,
    data: app,
  });
});

module.exports = createApp;
