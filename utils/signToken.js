const jwt = require('jsonwebtoken');

// The requested session duration comes from the client and is clamped to
// this allow-list — clients must never dictate arbitrary token lifetimes
// (upstream accepted anything, including multi-year sessions). Keep in sync
// with the duration dropdown in the client's AuthForm.
const ALLOWED_DURATIONS = ['1h', '1d', '7d', '14d', '30d'];
const DEFAULT_DURATION = '1d';

const signToken = (requestedDuration) => {
  const expiresIn = ALLOWED_DURATIONS.includes(requestedDuration)
    ? requestedDuration
    : DEFAULT_DURATION;

  return jwt.sign({ app: 'flame' }, process.env.SECRET, { expiresIn });
};

module.exports = signToken;
