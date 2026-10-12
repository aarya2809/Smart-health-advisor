const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getTodayLog,
  searchFoodItems,
  computeFoodNutrition,
  logMeal,
  updateWater,
  logWorkout,
  logSleep,
  logWeight,
  logCardio,
  getHistory
} = require('../controllers/trackingController');

router.use(authMiddleware);

router.get('/today', getTodayLog);
router.get('/food/search', searchFoodItems);
router.post('/food/compute', computeFoodNutrition);
router.post('/meal', logMeal);
router.post('/water', updateWater);
router.post('/workout', logWorkout);
router.post('/cardio', logCardio);
router.post('/sleep', logSleep);
router.post('/weight', logWeight);
router.get('/history', getHistory);

module.exports = router;
