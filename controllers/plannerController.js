const HealthProfile = require('../models/HealthProfile');
const DietPlan = require('../models/DietPlan');
const WorkoutPlan = require('../models/WorkoutPlan');
const { validateDietPlan, validateWorkoutPlan } = require('../utils/safetyValidator');
const { getSafeExercisesForProfile, sanitizeWorkoutPlan, isExerciseSafeForProfile } = require('../utils/injuryEngine');
const { searchFoods } = require('../utils/nutritionDatabase');
const { calculateBMR, calculateTDEE } = require('../utils/metricsCalculator');
const { calculateIndividualizedTargets } = require('../utils/proteinCalculator');

// Generate or Retrieve Diet Plan
const generateDietPlan = async (req, res) => {
  try {
    const { date } = req.body;
    let queryDate;
    if (date) {
      if (typeof date === 'string' && date.includes('T')) {
        queryDate = new Date(date);
      } else {
        queryDate = new Date(`${date}T00:00:00.000Z`);
      }
    } else {
      queryDate = new Date();
    }
    queryDate.setUTCHours(0, 0, 0, 0);

    const nextDay = new Date(queryDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    // Check if an existing plan exists for this date range
    let existingPlan = await DietPlan.findOne({
      user: req.user._id,
      date: { $gte: queryDate, $lt: nextDay }
    });
    if (existingPlan) return res.status(200).json({ success: true, plan: existingPlan });

    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(400).json({ success: false, message: 'Health profile missing. Please complete onboarding first.' });

    const bmrObj = calculateBMR(profile.weight || 70, profile.height || 170, profile.age || 25, profile.gender || 'male');
    const bmrValue = bmrObj ? bmrObj.value : (10 * (profile.weight || 70) + 6.25 * (profile.height || 170) - 5 * (profile.age || 25) + 5);
    const tdeeObj = calculateTDEE(bmrValue, profile.activityLevel || 'moderately_active');
    const tdeeValue = tdeeObj ? tdeeObj.value : Math.round(bmrValue * 1.55);

    const macroTargets = calculateIndividualizedTargets({
      tdee: tdeeValue,
      weightKg: profile.weight,
      heightCm: profile.height,
      age: profile.age,
      gender: profile.gender,
      goal: profile.primaryGoal,
      activityLevel: profile.activityLevel,
      dietType: profile.dietType
    });

    const targetCalories = macroTargets.calorieTarget;
    const targetProtein = macroTargets.proteinTargetGrams;
    const targetCarbs = macroTargets.carbTargetGrams;
    const targetFats = macroTargets.fatTargetGrams;

    const userDietType = profile.dietType || 'vegetarian';
    let meals = [];
    
    // AI Generation
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are an expert clinical nutritionist. Create a daily meal plan for a person with the following profile:
Diet Type: ${userDietType}
Goal: ${(profile.primaryGoal || 'general_fitness').replace(/_/g, ' ')}
Target Calories: ${Math.round(targetCalories)}
Target Macros: Protein ${Math.round(targetProtein)}g, Carbs ${Math.round(targetCarbs)}g, Fats ${Math.round(targetFats)}g.
Allergies/Avoid: ${(profile.allergies || []).map(a => a.allergen).join(', ') || 'None'}

Respond ONLY with a raw JSON array (no markdown code blocks, no backticks) where each object represents a meal and exactly matches this schema:
[
  { "type": "Breakfast", "foodName": "String", "portion": "String", "estimatedCalories": Number, "estimatedProtein": Number },
  { "type": "Lunch", "foodName": "String", "portion": "String", "estimatedCalories": Number, "estimatedProtein": Number },
  { "type": "Dinner", "foodName": "String", "portion": "String", "estimatedCalories": Number, "estimatedProtein": Number },
  { "type": "Snack", "foodName": "String", "portion": "String", "estimatedCalories": Number, "estimatedProtein": Number }
]`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });
        
        let cleanedJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        meals = JSON.parse(cleanedJson);
      } catch (err) {
        console.error("AI Diet Generation failed, falling back to nutritious default.", err);
      }
    }

    // High quality deterministic fallback adhering to dietary preference (Default Vegetarian)
    if (meals.length === 0) {
      if (userDietType === 'vegan') {
        meals = [
          { type: 'Breakfast', foodName: 'Oatmeal with Almond Milk & Banana', portion: '1 Bowl (250g)', estimatedCalories: 380, estimatedProtein: 14 },
          { type: 'Lunch', foodName: 'Chickpeas (Chole) & Brown Rice with Salad', portion: '1 Plate (350g)', estimatedCalories: 550, estimatedProtein: 22 },
          { type: 'Dinner', foodName: 'Stir-fry Tofu with Steamed Vegetables & Quinoa', portion: '1 Bowl (300g)', estimatedCalories: 480, estimatedProtein: 26 },
          { type: 'Snack', foodName: 'Roasted Chana & Handful of Almonds', portion: '50g', estimatedCalories: 200, estimatedProtein: 10 }
        ];
      } else if (userDietType === 'eggetarian') {
        meals = [
          { type: 'Breakfast', foodName: '3 Boiled Eggs & Whole Wheat Toast', portion: '2 Slices + 3 Eggs', estimatedCalories: 420, estimatedProtein: 26 },
          { type: 'Lunch', foodName: 'Yellow Dal Tadka, Steamed Rice & Curd', portion: '1 Plate', estimatedCalories: 580, estimatedProtein: 24 },
          { type: 'Dinner', foodName: 'Egg Bhurji (Scramble) with 2 Rotis & Salad', portion: '1 Plate', estimatedCalories: 490, estimatedProtein: 28 },
          { type: 'Snack', foodName: 'Greek Yogurt with Fresh Fruit', portion: '1 Bowl (150g)', estimatedCalories: 180, estimatedProtein: 15 }
        ];
      } else if (userDietType === 'non_vegetarian') {
        meals = [
          { type: 'Breakfast', foodName: 'Scrambled Eggs, Oatmeal & Berries', portion: '1 Plate', estimatedCalories: 440, estimatedProtein: 28 },
          { type: 'Lunch', foodName: 'Grilled Chicken Breast with Brown Rice & Broccoli', portion: '1 Plate', estimatedCalories: 620, estimatedProtein: 48 },
          { type: 'Dinner', foodName: 'Fish Fillet with Sweet Potato & Green Salad', portion: '1 Plate', estimatedCalories: 510, estimatedProtein: 42 },
          { type: 'Snack', foodName: 'Whey Protein Shake with Banana', portion: '1 Shake (300ml)', estimatedCalories: 210, estimatedProtein: 26 }
        ];
      } else {
        // Default: Vegetarian
        meals = [
          { type: 'Breakfast', foodName: 'Moong Dal Chilla / Vegetable Oats with Dahi', portion: '2 Chillas + Dahi', estimatedCalories: 410, estimatedProtein: 20 },
          { type: 'Lunch', foodName: 'Palak Paneer with 2 Whole Wheat Rotis & Salad', portion: '1 Thali', estimatedCalories: 590, estimatedProtein: 26 },
          { type: 'Dinner', foodName: 'Yellow Moong Dal, Jeera Rice & Stir-fried Paneer', portion: '1 Plate', estimatedCalories: 520, estimatedProtein: 25 },
          { type: 'Snack', foodName: 'Roasted Makhana & Greek Yogurt / Curd', portion: '1 Bowl', estimatedCalories: 190, estimatedProtein: 12 }
        ];
      }
    }

    const planData = {
      user: req.user._id,
      date: queryDate,
      targetCalories: Math.round(targetCalories),
      targetProtein: Math.round(targetProtein),
      targetCarbs: Math.round(targetCarbs),
      targetFats: Math.round(targetFats),
      dietType: userDietType,
      calculationMethod: macroTargets.calculationMethod,
      rationale: macroTargets.rationale,
      referenceWeightKg: macroTargets.referenceWeightKg,
      meals
    };

    // STRICT BACKEND SAFETY VALIDATION
    try {
      validateDietPlan(planData, profile);
    } catch (validationError) {
      return res.status(403).json({ success: false, message: validationError.message });
    }

    const newPlan = await DietPlan.create(planData);
    res.status(201).json({ success: true, plan: newPlan });
  } catch (error) {
    console.error('generateDietPlan error:', error);
    res.status(500).json({ success: false, message: 'Server error generating diet plan' });
  }
};

// Generate or Retrieve Workout Plan
const generateWorkoutPlan = async (req, res) => {
  try {
    const { date } = req.body;
    let queryDate;
    if (date) {
      if (typeof date === 'string' && date.includes('T')) {
        queryDate = new Date(date);
      } else {
        queryDate = new Date(`${date}T00:00:00.000Z`);
      }
    } else {
      queryDate = new Date();
    }
    queryDate.setUTCHours(0, 0, 0, 0);

    const nextDay = new Date(queryDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    // Check if an existing plan exists for this date range
    let existingPlan = await WorkoutPlan.findOne({
      user: req.user._id,
      date: { $gte: queryDate, $lt: nextDay }
    });

    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(400).json({ success: false, message: 'Health profile missing. Please complete onboarding first.' });

    // REVALIDATE EXISTING PLAN: Ensure cached plans never bypass updated injury safety rules
    if (existingPlan) {
      const { sanitizedPlan, substitutionsMade } = sanitizeWorkoutPlan(existingPlan, profile);
      if (substitutionsMade > 0) {
        existingPlan.exercises = sanitizedPlan.exercises;
        existingPlan.safetyAuditPassed = true;
        await existingPlan.save();
      }
      return res.status(200).json({ success: true, plan: existingPlan });
    }

    let objective = 'Functional Strength & Conditioning';
    let exercises = [];
    let estimatedDuration = profile.workoutDurationMinutes || 45;

    const hasGym = profile.accessToGym;

    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const injuriesList = (profile.injuries || []).map(i => `${i.bodyPart}: avoid ${(i.movementsToAvoid || []).join(', ')}`).join('; ') || 'None';
      const prompt = `You are an expert clinical personal trainer. Create a single daily workout for a person with this profile:
Goal: ${(profile.primaryGoal || 'general_fitness').replace(/_/g, ' ')}
Access to Gym: ${hasGym ? 'Yes (Full gym equipment)' : 'No (Bodyweight only)'}
Fitness Level: ${profile.exerciseExperience || 'Intermediate'}
Injuries/Restrictions: ${injuriesList}
CRITICAL SAFETY RESTRICTION: If the user has any knee injury or leg limitation, NEVER recommend squats, lunges, leg press, jumps, or knee-bending movements. Focus on upper body and knee-friendly core.

Respond ONLY with a raw JSON object (no markdown, no backticks) exactly matching this schema:
{
  "objective": "String (e.g., Upper Body Hypertrophy, Core & Conditioning)",
  "estimatedDuration": Number (in minutes, e.g. 45),
  "exercises": [
    { "name": "String", "sets": Number, "reps": "String (e.g., '10-12' or '45 sec')", "restSeconds": Number, "instructions": "String" }
  ]
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });
        
        let cleanedJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiPlan = JSON.parse(cleanedJson);
        objective = aiPlan.objective || objective;
        estimatedDuration = aiPlan.estimatedDuration || estimatedDuration;
        
        // Pass AI exercises through clinical injury sanitization engine
        if (Array.isArray(aiPlan.exercises)) {
          const { sanitizedPlan } = sanitizeWorkoutPlan({ exercises: aiPlan.exercises }, profile);
          exercises = sanitizedPlan.exercises;
        }
      } catch (err) {
        console.error("AI Workout Generation failed, falling back to verified exercise library.", err);
      }
    }

    // Deterministic fallback using injury-aware clinical exercise library
    if (exercises.length === 0) {
      objective = hasGym ? 'Upper Body & Core Circuit' : 'Functional Conditioning';
      exercises = getSafeExercisesForProfile(profile, 5);
      estimatedDuration = 40;
    }

    const planData = {
      user: req.user._id,
      date: queryDate,
      objective,
      estimatedDuration,
      exercises,
      safetyAuditPassed: true
    };

    // STRICT BACKEND SAFETY VALIDATION
    try {
      validateWorkoutPlan(planData, profile);
    } catch (validationError) {
      // If validation somehow catches a violation, force clean fallback
      const safeExercises = getSafeExercisesForProfile(profile, 4);
      planData.exercises = safeExercises;
    }

    const newPlan = await WorkoutPlan.create(planData);
    res.status(201).json({ success: true, plan: newPlan });
    res.status(201).json({ success: true, plan: newPlan });
  } catch (error) {
    console.error('generateWorkoutPlan error:', error);
    res.status(500).json({ success: false, message: 'Server error generating workout plan' });
  }
};

// MARK MEAL COMPLETED OR UPDATE MEAL
const updateDietMealStatus = async (req, res) => {
  try {
    const { planId, mealId, completed } = req.body;
    
    // Find plan by ID or by user's active/today plan
    let query = { user: req.user._id };
    if (planId) {
      query._id = planId;
    }

    let plan;
    if (mealId) {
      plan = await DietPlan.findOneAndUpdate(
        { ...query, 'meals._id': mealId },
        { $set: { 'meals.$.completed': completed } },
        { new: true }
      );
    } else {
      plan = await DietPlan.findOne(query).sort({ date: -1 });
    }
    
    if (!plan) return res.status(404).json({ success: false, message: 'Diet plan not found' });
    res.status(200).json({ success: true, plan });
  } catch (error) {
    console.error('updateDietMealStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error updating meal' });
  }
};

// MARK WORKOUT COMPLETED OR SKIPPED
const updateWorkoutStatus = async (req, res) => {
  try {
    const { planId, completed, skipped, skipReason, completedExercises, perceivedEffort, painOrDiscomfort } = req.body;
    
    // Look up either by planId or by user's most recent/today workout plan
    let query = { user: req.user._id };
    if (planId && planId !== 'null' && planId !== 'undefined') {
      query._id = planId;
    }

    let plan = await WorkoutPlan.findOne(query).sort({ date: -1 });
    
    if (!plan) {
      // Auto-create a workout plan for today if one didn't exist yet
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const profile = await HealthProfile.findOne({ user: req.user._id });
      const safeExercises = getSafeExercisesForProfile(profile || {}, 4);
      
      plan = await WorkoutPlan.create({
        user: req.user._id,
        date: today,
        objective: 'Daily Training Session',
        estimatedDuration: 45,
        exercises: safeExercises,
        completed: Boolean(completed),
        skipped: Boolean(skipped),
        skipReason: skipReason || ''
      });
    } else {
      if (completed !== undefined) plan.completed = completed;
      if (skipped !== undefined) plan.skipped = skipped;
      if (skipReason !== undefined) plan.skipReason = skipReason;
      
      // Update individual exercises completion if passed
      if (completedExercises && Array.isArray(completedExercises)) {
        plan.exercises = plan.exercises.map(ex => {
          const isDone = completedExercises.some(ce => (typeof ce === 'string' ? ce === ex.name : ce.name === ex.name));
          return { ...ex.toObject ? ex.toObject() : ex, completed: isDone };
        });
      }
      await plan.save();
    }

    res.status(200).json({ success: true, plan, message: 'Workout status saved successfully' });
  } catch (error) {
    console.error('updateWorkoutStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error updating workout' });
  }
};

// General Plan Update Endpoint (Accepts edits, substitutions, rescheduling)
const updatePlanDetails = async (req, res) => {
  try {
    const { planType, planId, action, payload } = req.body;
    // planType: 'workout' or 'diet'
    if (planType === 'workout') {
      const plan = await WorkoutPlan.findOne({ _id: planId, user: req.user._id });
      if (!plan) return res.status(404).json({ success: false, message: 'Workout plan not found' });

      if (action === 'reschedule' && payload.date) {
        plan.date = new Date(payload.date);
      } else if (action === 'replace_exercise' && payload.oldName && payload.newExercise) {
        const profile = await HealthProfile.findOne({ user: req.user._id });
        const safetyCheck = isExerciseSafeForProfile(payload.newExercise, profile);
        if (!safetyCheck.safe) {
          return res.status(400).json({ success: false, message: `Replacement exercise violates injury safety: ${safetyCheck.reason}` });
        }
        plan.exercises = plan.exercises.map(ex => ex.name === payload.oldName ? payload.newExercise : ex);
      }
      await plan.save();
      return res.status(200).json({ success: true, plan, message: 'Workout plan updated successfully' });
    } else {
      const plan = await DietPlan.findOne({ _id: planId, user: req.user._id });
      if (!plan) return res.status(404).json({ success: false, message: 'Diet plan not found' });

      if (action === 'replace_food' && payload.mealId && payload.newFood) {
        const meal = plan.meals.id(payload.mealId);
        if (meal) {
          meal.foodName = payload.newFood.foodName;
          meal.portion = payload.newFood.portion || meal.portion;
          meal.estimatedCalories = payload.newFood.estimatedCalories || meal.estimatedCalories;
          meal.estimatedProtein = payload.newFood.estimatedProtein || meal.estimatedProtein;
        }
      }
      await plan.save();
      return res.status(200).json({ success: true, plan, message: 'Diet plan updated successfully' });
    }
  } catch (error) {
    console.error('updatePlanDetails error:', error);
    res.status(500).json({ success: false, message: 'Server error updating plan details' });
  }
};

module.exports = {
  generateDietPlan,
  generateWorkoutPlan,
  updateDietMealStatus,
  updateWorkoutStatus,
  updatePlanDetails
};
