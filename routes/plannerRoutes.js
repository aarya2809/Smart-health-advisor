const express = require('express');
const router = express.Router();
const { 
  generateDietPlan, 
  generateWorkoutPlan, 
  updateDietMealStatus, 
  updateWorkoutStatus 
} = require('../controllers/plannerController');
const protect = require('../middleware/authMiddleware');

router.post('/diet', protect, generateDietPlan);
router.post('/workout', protect, generateWorkoutPlan);
router.put('/diet/meal', protect, updateDietMealStatus);
router.put('/workout/status', protect, updateWorkoutStatus);

module.exports = router;
