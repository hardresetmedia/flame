const asyncWrapper = require('../../middleware/asyncWrapper');
const getClientIp = require('../../utils/getClientIp');

// @desc      Report the caller's real IP (Cloudflare-aware) so the client can
//            evaluate profile IP/CIDR rules — the browser cannot see its own
//            public IP.
// @route     GET /api/client-hints
// @access    Public
const getClientHints = asyncWrapper(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      ip: getClientIp(req),
    },
  });
});

module.exports = getClientHints;
