const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getTodayLog,
  logMeal,
  updateWater,
  logWorkout,
  logWeight,
  getHistory
} = require('../controllers/trackingController');

router.use(authMiddleware);

router.get('/today', getTodayLog);
router.post('/meal', logMeal);
router.post('/water', updateWater);
router.post('/workout', logWorkout);
router.post('/weight', logWeight);
router.get('/history', getHistory);

module.exports = router;
