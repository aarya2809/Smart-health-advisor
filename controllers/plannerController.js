// ... existing imports ...
const HealthProfile = require('../models/HealthProfile');
const DietPlan = require('../models/DietPlan');
const WorkoutPlan = require('../models/WorkoutPlan');

// Helper to calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
const calculateBMR = (weight, height, age, gender) => {
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  return gender === 'male' ? bmr + 5 : bmr - 161;
};

// Generate Diet Plan
const generateDietPlan = async (req, res) => {
  try {
    const { date } = req.body;
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    let existingPlan = await DietPlan.findOne({ user: req.user._id, date: queryDate });
    if (existingPlan) return res.status(200).json({ success: true, plan: existingPlan });

    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(400).json({ success: false, message: 'Health profile missing.' });

    let bmr = calculateBMR(profile.weight || 70, profile.height || 170, profile.age || 25, profile.gender || 'male');
    
    let activityMultiplier = 1.2;
    if (profile.activityLevel === 'lightly_active') activityMultiplier = 1.375;
    if (profile.activityLevel === 'moderately_active') activityMultiplier = 1.55;
    if (profile.activityLevel === 'very_active') activityMultiplier = 1.725;
    if (profile.activityLevel === 'extra_active') activityMultiplier = 1.9;

    let tdee = bmr * activityMultiplier;
    let targetCalories = tdee;

    if (profile.primaryGoal === 'lose_fat') targetCalories -= 500;
    if (profile.primaryGoal === 'build_muscle' || profile.primaryGoal === 'gain_weight') targetCalories += 300;

    let targetProtein = profile.primaryGoal === 'build_muscle' ? (profile.weight * 2) : (profile.weight * 1.5);
    let targetFats = (targetCalories * 0.25) / 9;
    let targetCarbs = (targetCalories - (targetProtein * 4) - (targetFats * 9)) / 4;

    let meals = [];
    if (profile.dietType === 'vegan') {
      meals = [
        { type: 'Breakfast', foodName: 'Oatmeal with Almond Milk and Berries', portion: '1 Bowl', estimatedCalories: 350, estimatedProtein: 10 },
        { type: 'Lunch', foodName: 'Lentil and Quinoa Salad', portion: '1 Plate', estimatedCalories: 500, estimatedProtein: 20 },
        { type: 'Dinner', foodName: 'Tofu Stir-fry with Broccoli', portion: '1 Bowl', estimatedCalories: 450, estimatedProtein: 25 },
        { type: 'Snack', foodName: 'Handful of Mixed Nuts', portion: '30g', estimatedCalories: 200, estimatedProtein: 6 }
      ];
    } else if (profile.dietType === 'vegetarian') {
      meals = [
        { type: 'Breakfast', foodName: 'Greek Yogurt with Honey', portion: '1 Cup', estimatedCalories: 250, estimatedProtein: 15 },
        { type: 'Lunch', foodName: 'Paneer Tikka Wrap', portion: '1 Wrap', estimatedCalories: 550, estimatedProtein: 22 },
        { type: 'Dinner', foodName: 'Dal Tadka with Brown Rice', portion: '1 Bowl', estimatedCalories: 480, estimatedProtein: 18 },
        { type: 'Snack', foodName: 'Protein Shake (Whey)', portion: '1 Scoop', estimatedCalories: 120, estimatedProtein: 25 }
      ];
    } else {
      meals = [
        { type: 'Breakfast', foodName: 'Scrambled Eggs with Whole Wheat Toast', portion: '3 Eggs, 2 Slices', estimatedCalories: 400, estimatedProtein: 24 },
        { type: 'Lunch', foodName: 'Grilled Chicken Breast with Sweet Potato', portion: '150g Chicken, 1 Potato', estimatedCalories: 500, estimatedProtein: 40 },
        { type: 'Dinner', foodName: 'Baked Salmon with Asparagus', portion: '1 Fillet', estimatedCalories: 450, estimatedProtein: 35 },
        { type: 'Snack', foodName: 'Protein Shake (Whey)', portion: '1 Scoop', estimatedCalories: 120, estimatedProtein: 25 }
      ];
    }

    const newPlan = await DietPlan.create({
      user: req.user._id,
      date: queryDate,
      targetCalories: Math.round(targetCalories),
      targetProtein: Math.round(targetProtein),
      targetCarbs: Math.round(targetCarbs),
      targetFats: Math.round(targetFats),
      meals
    });

    res.status(201).json({ success: true, plan: newPlan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error generating diet plan' });
  }
};

// Generate Workout Plan
const generateWorkoutPlan = async (req, res) => {
  try {
    const { date } = req.body;
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    let existingPlan = await WorkoutPlan.findOne({ user: req.user._id, date: queryDate });
    if (existingPlan) return res.status(200).json({ success: true, plan: existingPlan });

    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(400).json({ success: false, message: 'Health profile missing.' });

    let objective = 'Full Body Conditioning';
    let exercises = [];
    let estimatedDuration = 45;

    const hasGym = profile.accessToGym;

    if (profile.primaryGoal === 'build_muscle') {
      objective = 'Hypertrophy - Upper Body';
      exercises = hasGym ? [
        { name: 'Barbell Bench Press', sets: 4, reps: '8-10', restSeconds: 90 },
        { name: 'Lat Pulldown', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Tricep Rope Pushdown', sets: 3, reps: '12-15', restSeconds: 45 }
      ] : [
        { name: 'Push-ups', sets: 4, reps: 'To Failure', restSeconds: 60 },
        { name: 'Pull-ups', sets: 3, reps: '8-10', restSeconds: 90 },
        { name: 'Pike Push-ups', sets: 3, reps: '10-12', restSeconds: 60 },
        { name: 'Chair Dips', sets: 3, reps: '12-15', restSeconds: 45 }
      ];
      estimatedDuration = 55;
    } else if (profile.primaryGoal === 'lose_fat') {
      objective = 'HIIT & Core Burn';
      exercises = [
        { name: 'Jumping Jacks', sets: 4, reps: '45 sec', restSeconds: 15 },
        { name: 'Burpees', sets: 4, reps: '45 sec', restSeconds: 15 },
        { name: 'Mountain Climbers', sets: 4, reps: '45 sec', restSeconds: 15 },
        { name: 'Plank', sets: 3, reps: '60 sec', restSeconds: 30 }
      ];
      estimatedDuration = 30;
    } else {
      objective = 'Functional Strength';
      exercises = [
        { name: 'Bodyweight Squats', sets: 3, reps: '15-20', restSeconds: 60 },
        { name: 'Push-ups', sets: 3, reps: '10-15', restSeconds: 60 },
        { name: 'Walking Lunges', sets: 3, reps: '12 per leg', restSeconds: 60 },
        { name: 'Plank', sets: 3, reps: '45 sec', restSeconds: 30 }
      ];
      estimatedDuration = 40;
    }

    const newPlan = await WorkoutPlan.create({
      user: req.user._id,
      date: queryDate,
      objective,
      estimatedDuration,
      exercises
    });

    res.status(201).json({ success: true, plan: newPlan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error generating workout plan' });
  }
};

// MARK MEAL COMPLETED
const updateDietMealStatus = async (req, res) => {
  try {
    const { planId, mealId, completed } = req.body;
    
    const plan = await DietPlan.findOneAndUpdate(
      { _id: planId, user: req.user._id, 'meals._id': mealId },
      { $set: { 'meals.$.completed': completed } },
      { new: true }
    );
    
    if (!plan) return res.status(404).json({ success: false, message: 'Plan or meal not found' });
    res.status(200).json({ success: true, plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error updating meal' });
  }
};

// MARK WORKOUT COMPLETED OR SKIPPED
const updateWorkoutStatus = async (req, res) => {
  try {
    const { planId, completed, skipped, skipReason } = req.body;
    
    const plan = await WorkoutPlan.findOneAndUpdate(
      { _id: planId, user: req.user._id },
      { $set: { completed, skipped, skipReason } },
      { new: true }
    );
    
    if (!plan) return res.status(404).json({ success: false, message: 'Workout plan not found' });

    // Adaptive Engine: If skipped, we can adjust tomorrow's plan or leave a note.
    if (skipped) {
       // In a real app we might create a recovery plan for tomorrow.
       // For this phase, we just record the skip.
       console.log(`User ${req.user.name} skipped workout: ${skipReason}`);
    }

    res.status(200).json({ success: true, plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error updating workout' });
  }
};

module.exports = {
  generateDietPlan,
  generateWorkoutPlan,
  updateDietMealStatus,
  updateWorkoutStatus
};
