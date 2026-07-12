const express = require('express');
const router = express.Router();

const { login, validate } = require('../controllers/auth');
const requireBody = require('../middleware/requireBody');
const { loginLimiter } = require('../middleware/rateLimiters');

// loginLimiter: brute-force gate — validate stays unlimited because every
// client boot calls it
router
  .route('/')
  .post(loginLimiter, requireBody(['password', 'duration']), login);

router.route('/validate').post(requireBody(['token']), validate);

module.exports = router;
