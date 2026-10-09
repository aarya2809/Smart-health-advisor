// ... existing imports ...
const HealthProfile = require('../models/HealthProfile');
const DietPlan = require('../models/DietPlan');
const WorkoutPlan = require('../models/WorkoutPlan');
const { validateDietPlan, validateWorkoutPlan } = require('../utils/safetyValidator');

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
    
    // AI Generation
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are an expert nutritionist. Create a daily meal plan for a person with the following profile:
Diet Type: ${profile.dietType}
Goal: ${profile.primaryGoal.replace('_', ' ')}
Target Calories: ${Math.round(targetCalories)}
Target Macros: Protein ${Math.round(targetProtein)}g, Carbs ${Math.round(targetCarbs)}g, Fats ${Math.round(targetFats)}g.

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
        console.error("AI Diet Generation failed, falling back to default.", err);
      }
    }

    // Fallback if AI fails or no key
    if (meals.length === 0) {
      meals = [
        { type: 'Breakfast', foodName: 'Oatmeal & Eggs', portion: '1 Bowl', estimatedCalories: 400, estimatedProtein: 20 },
        { type: 'Lunch', foodName: 'Chicken & Rice', portion: '1 Plate', estimatedCalories: 600, estimatedProtein: 40 },
        { type: 'Dinner', foodName: 'Steak & Veggies', portion: '1 Plate', estimatedCalories: 500, estimatedProtein: 35 },
        { type: 'Snack', foodName: 'Protein Shake', portion: '1 Scoop', estimatedCalories: 150, estimatedProtein: 25 }
      ];
    }

    const planData = {
      user: req.user._id,
      date: queryDate,
      targetCalories: Math.round(targetCalories),
      targetProtein: Math.round(targetProtein),
      targetCarbs: Math.round(targetCarbs),
      targetFats: Math.round(targetFats),
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

    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are an expert personal trainer. Create a single daily workout for a person with this profile:
Goal: ${profile.primaryGoal.replace('_', ' ')}
Access to Gym: ${hasGym ? 'Yes (Full equipment)' : 'No (Bodyweight only)'}
Fitness Level: Beginner to Intermediate

Respond ONLY with a raw JSON object (no markdown, no backticks) exactly matching this schema:
{
  "objective": "String (e.g., Upper Body Hypertrophy, HIIT Cardio)",
  "estimatedDuration": Number (in minutes, e.g. 45),
  "exercises": [
    { "name": "String", "sets": Number, "reps": "String (e.g., '10-12' or '60 sec')", "restSeconds": Number }
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
        exercises = aiPlan.exercises || [];
      } catch (err) {
        console.error("AI Workout Generation failed, falling back.", err);
      }
    }

    if (exercises.length === 0) {
      objective = 'Functional Strength';
      exercises = [
        { name: 'Bodyweight Squats', sets: 3, reps: '15', restSeconds: 60 },
        { name: 'Push-ups', sets: 3, reps: '10', restSeconds: 60 },
        { name: 'Plank', sets: 3, reps: '45 sec', restSeconds: 30 }
      ];
      estimatedDuration = 30;
    }

    const planData = {
      user: req.user._id,
      date: queryDate,
      objective,
      estimatedDuration,
      exercises
    };

    // STRICT BACKEND SAFETY VALIDATION
    try {
      validateWorkoutPlan(planData, profile);
    } catch (validationError) {
      return res.status(403).json({ success: false, message: validationError.message });
    }

    const newPlan = await WorkoutPlan.create(planData);

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
