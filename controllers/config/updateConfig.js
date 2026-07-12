const asyncWrapper = require('../../middleware/asyncWrapper');
const ErrorResponse = require('../../utils/ErrorResponse');
const loadConfig = require('../../utils/loadConfig');
const pick = require('../../utils/pick');
const { ALL_CONFIG_KEYS } = require('../../utils/configKeys');
const { writeFile } = require('fs/promises');

// dockerHost is used to build container-API URLs server-side; restrict it
// to a bare hostname/IP with an optional port (no scheme, path or spaces)
// so it cannot be turned into an SSRF primitive.
const DOCKER_HOST_PATTERN = /^[a-zA-Z0-9.-]+(:\d{1,5})?$/;

// @desc      Update config
// @route     PUT /api/config/
// @access    Private
const updateConfig = asyncWrapper(async (req, res, next) => {
  // allow-list: clients cannot inject keys that are not real config keys
  const changes = pick(req.body, ALL_CONFIG_KEYS);

  if (
    changes.dockerHost !== undefined &&
    !DOCKER_HOST_PATTERN.test(String(changes.dockerHost))
  ) {
    return next(
      new ErrorResponse('dockerHost must be a bare hostname[:port]', 400)
    );
  }

  const existingConfig = await loadConfig();

  const newConfig = {
    ...existingConfig,
    ...changes,
  };

  await writeFile('data/config.json', JSON.stringify(newConfig));

  res.status(200).send({
    success: true,
    data: newConfig,
  });
});

module.exports = updateConfig;
