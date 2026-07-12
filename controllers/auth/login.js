const crypto = require('crypto');
const asyncWrapper = require('../../middleware/asyncWrapper');
const ErrorResponse = require('../../utils/ErrorResponse');
const signToken = require('../../utils/signToken');
const Logger = require('../../utils/Logger');
const logger = new Logger();

// Passwords that ship in images/docs/committed .env files. Refusing them
// forces every real deployment to configure its own PASSWORD.
const KNOWN_DEFAULT_PASSWORDS = ['flame_password', 'change_me'];

// Compare via fixed-length digests: timingSafeEqual needs equal-length
// inputs, and hashing both sides keeps the comparison constant-time
// regardless of password lengths.
const timingSafeEqualStrings = (a, b) => {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();

  return crypto.timingSafeEqual(hashA, hashB);
};

// @desc      Login user
// @route     POST /api/auth/
// @access    Public
const login = asyncWrapper(async (req, res, next) => {
  const { password, duration } = req.body;

  const configuredPassword = process.env.PASSWORD;

  if (
    !configuredPassword ||
    KNOWN_DEFAULT_PASSWORDS.includes(configuredPassword)
  ) {
    logger.log(
      'Login rejected: PASSWORD is unset or still a known default — set a real password',
      'ERROR'
    );
    return next(
      new ErrorResponse('Authentication is not configured on this server', 503)
    );
  }

  if (
    typeof password !== 'string' ||
    !timingSafeEqualStrings(configuredPassword, password)
  ) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  const token = signToken(duration);

  res.status(200).json({
    success: true,
    data: { token },
  });
});

module.exports = login;
