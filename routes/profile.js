const express = require('express');
const router = express.Router();

// middleware
const { auth, requireAuth } = require('../middleware');

const {
  getAllProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  reorderProfiles,
} = require('../controllers/profiles');

// GET is public: profile rules are evaluated client-side before login
router
  .route('/')
  .get(getAllProfiles)
  .post(auth, requireAuth, createProfile);

router
  .route('/:id')
  .put(auth, requireAuth, updateProfile)
  .delete(auth, requireAuth, deleteProfile);

router.route('/0/reorder').put(auth, requireAuth, reorderProfiles);

module.exports = router;
