const express = require('express');
const router = express.Router();

const { getClientHints } = require('../controllers/clientHints');

// Public: consumed at client boot before login to evaluate profile rules
router.route('/').get(getClientHints);

module.exports = router;
