const express = require('express');
const router = express.Router();

// middleware
const { auth, requireAuth } = require('../middleware');

const {
  getCSS,
  updateCSS,
  getConfig,
  updateConfig,
} = require('../controllers/config');

// auth (soft) on GET so authenticated clients receive the full config while
// anonymous ones get the redacted public subset
router.route('/').get(auth, getConfig).put(auth, requireAuth, updateConfig);

router.route('/0/css').get(getCSS).put(auth, requireAuth, updateCSS);

module.exports = router;
