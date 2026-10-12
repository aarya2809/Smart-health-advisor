const HealthProfile = require('../models/HealthProfile');
const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.status(200).json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const WorkoutPlan = require('../models/WorkoutPlan');
const DietPlan = require('../models/DietPlan');
const { sanitizeWorkoutPlan } = require('../utils/injuryEngine');
const { calculateBMR, calculateTDEE } = require('../utils/metricsCalculator');
const { calculateIndividualizedTargets } = require('../utils/proteinCalculator');

const upsertProfile = async (req, res) => {
  try {
    const profileData = { ...req.body, user: req.user._id };
    
    // Create or update profile
    const profile = await HealthProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true }
    );

    // 1. Revalidate all active and future workout plans against new injury rules
    try {
      const activeWorkoutPlans = await WorkoutPlan.find({
        user: req.user._id,
        completed: false
      });

      for (const wPlan of activeWorkoutPlans) {
        const { sanitizedPlan, substitutionsMade } = sanitizeWorkoutPlan(wPlan, profile);
        if (substitutionsMade > 0) {
          wPlan.exercises = sanitizedPlan.exercises;
          wPlan.safetyAuditPassed = true;
          await wPlan.save();
        }
      }
    } catch (wErr) {
      console.error('Error revalidating workout plans on profile update:', wErr);
    }

    // 2. Recalculate active diet plan targets if weight, goal, or height was updated
    try {
      const activeDietPlan = await DietPlan.findOne({
        user: req.user._id
      }).sort({ date: -1 });

      if (activeDietPlan && profile.weight && profile.height) {
        const bmrObj = calculateBMR(profile.weight, profile.height, profile.age || 25, profile.gender || 'male');
        const bmrVal = bmrObj ? bmrObj.value : (10 * profile.weight + 6.25 * profile.height - 5 * 25 + 5);
        const tdeeObj = calculateTDEE(bmrVal, profile.activityLevel || 'moderately_active');
        const tdeeVal = tdeeObj ? tdeeObj.value : Math.round(bmrVal * 1.55);

        const newTargets = calculateIndividualizedTargets({
          tdee: tdeeVal,
          weightKg: profile.weight,
          heightCm: profile.height,
          age: profile.age,
          gender: profile.gender,
          goal: profile.primaryGoal,
          activityLevel: profile.activityLevel,
          dietType: profile.dietType
        });

        activeDietPlan.targetCalories = newTargets.calorieTarget;
        activeDietPlan.targetProtein = newTargets.proteinTargetGrams;
        activeDietPlan.targetCarbs = newTargets.carbTargetGrams;
        activeDietPlan.targetFats = newTargets.fatTargetGrams;
        activeDietPlan.calculationMethod = newTargets.calculationMethod;
        activeDietPlan.rationale = newTargets.rationale;
        activeDietPlan.referenceWeightKg = newTargets.referenceWeightKg;
        await activeDietPlan.save();
      }
    } catch (dErr) {
      console.error('Error recalculating diet plan on profile update:', dErr);
    }
    
    res.status(200).json({ success: true, message: 'Profile saved successfully and plans revalidated', profile });
  } catch (error) {
    console.error('Profile save error:', error);
    res.status(500).json({ success: false, message: 'Server error while saving profile' });
  }
};

module.exports = {
  getProfile,
  upsertProfile
};
