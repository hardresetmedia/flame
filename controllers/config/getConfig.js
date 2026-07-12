const asyncWrapper = require('../../middleware/asyncWrapper');
const loadConfig = require('../../utils/loadConfig');
const pick = require('../../utils/pick');
const { PUBLIC_CONFIG_KEYS } = require('../../utils/configKeys');

// @desc      Get config — full when authenticated, redacted public subset
//            otherwise (keeps WEATHER_API_KEY, coordinates and docker/k8s
//            settings away from anonymous visitors)
// @route     GET /api/config
// @access    Public (redacted) / Private (full)
const getConfig = asyncWrapper(async (req, res, next) => {
  const config = await loadConfig();

  const data = req.isAuthenticated
    ? config
    : pick(config, PUBLIC_CONFIG_KEYS);

  res.status(200).json({
    success: true,
    data,
  });
});

module.exports = getConfig;
