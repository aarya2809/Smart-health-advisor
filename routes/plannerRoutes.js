const express = require('express');
const router = express.Router();
const { 
  generateDietPlan, 
  generateWorkoutPlan, 
  updateDietMealStatus, 
  updateWorkoutStatus,
  updatePlanDetails,
  switchWorkoutLocation,
  addCardioToPlan
} = require('../controllers/plannerController');
const protect = require('../middleware/authMiddleware');

router.post('/diet', protect, generateDietPlan);
router.post('/workout', protect, generateWorkoutPlan);
router.put('/diet/meal', protect, updateDietMealStatus);
router.put('/workout/status', protect, updateWorkoutStatus);
router.put('/workout/location', protect, switchWorkoutLocation);
router.post('/workout/cardio', protect, addCardioToPlan);
router.put('/update', protect, updatePlanDetails);

module.exports = router;
