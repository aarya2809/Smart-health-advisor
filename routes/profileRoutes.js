const express = require('express');
const router = express.Router();
const { getProfile, upsertProfile } = require('../controllers/profileController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, getProfile);
router.post('/', protect, upsertProfile);
router.put('/', protect, upsertProfile);

module.exports = router;
