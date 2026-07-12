// Rate limiters keyed on the real client IP (Cloudflare-aware via
// utils/getClientIp.js). loginLimiter is the brute-force gate on
// POST /api/auth; apiLimiter is a coarse safety net across /api/*.
// In-memory stores are fine here: single-process, single-user server.
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const getClientIp = require('../utils/getClientIp');

// ipKeyGenerator normalizes IPv6 addresses to their /56 so one client
// cannot rotate through a whole v6 block to dodge the limit.
const keyGenerator = (req) => ipKeyGenerator(getClientIp(req));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts, try again later',
  },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, slow down',
  },
});

module.exports = {
  loginLimiter,
  apiLimiter,
};
