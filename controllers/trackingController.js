const TrackingLog = require('../models/TrackingLog');
const HealthProfile = require('../models/HealthProfile');
const { searchFoods, calculateNutrition } = require('../utils/nutritionDatabase');
const { CARDIO_ACTIVITIES } = require('../utils/cardioEngine');

// Helper to get local date string YYYY-MM-DD
const getTodayDateString = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getTodayLog = async (req, res) => {
  try {
    const date = req.query.date || getTodayDateString();
    let log = await TrackingLog.findOne({ user: req.user._id, date });

    if (!log) {
      log = await TrackingLog.create({
        user: req.user._id,
        date,
        waterIntakeMl: 0,
        waterTargetMl: 2500,
        meals: [],
        workoutCompleted: false,
        workoutSkipped: false,
        completedExercises: [],
        sleepHours: 0
      });
    }

    res.status(200).json({ success: true, log });
  } catch (error) {
    console.error('getTodayLog error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving tracking log' });
  }
};

// Automatic Nutrition Food Search
const searchFoodItems = async (req, res) => {
  try {
    const { query } = req.query;
    const profile = await HealthProfile.findOne({ user: req.user._id });
    const userDiet = profile?.dietType || 'vegetarian';
    const userAllergies = profile?.allergies || [];

    const results = searchFoods(query, userDiet, userAllergies);
    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('searchFoodItems error:', error);
    res.status(500).json({ success: false, message: 'Server error searching foods' });
  }
};

// Automatic Nutrition Calculator
const computeFoodNutrition = async (req, res) => {
  try {
    const { foodId, quantity, customGrams } = req.body;
    const nutrition = calculateNutrition(foodId, quantity, customGrams);
    res.status(200).json({ success: true, nutrition });
  } catch (error) {
    console.error('computeFoodNutrition error:', error);
    res.status(500).json({ success: false, message: 'Server error computing food nutrition' });
  }
};

const logMeal = async (req, res) => {
  try {
    const { foodId, name, mealType, quantity, customGrams, calories, protein, carbs, fats, date } = req.body;
    if (!name && !foodId) {
      return res.status(400).json({ success: false, message: 'Food item or name is required' });
    }

    const logDate = date || getTodayDateString();
    let log = await TrackingLog.findOne({ user: req.user._id, date: logDate });

    if (!log) {
      log = new TrackingLog({
        user: req.user._id,
        date: logDate,
        meals: []
      });
    }

    // If calories/protein not provided, compute automatically from database
    let mealNutrition = {
      name: name || 'Custom Meal',
      mealType: mealType || 'snack',
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
      portion: `${quantity || 1} serving`,
      isEstimated: true
    };

    if (foodId) {
      const calc = calculateNutrition(foodId, quantity || 1, customGrams);
      mealNutrition.name = calc.foodName;
      mealNutrition.calories = calc.calories;
      mealNutrition.protein = calc.protein;
      mealNutrition.carbs = calc.carbs;
      mealNutrition.fats = calc.fats;
      mealNutrition.portion = calc.portion;
      mealNutrition.isEstimated = calc.isEstimated;
    }

    log.meals.push({
      ...mealNutrition,
      completed: true,
      loggedAt: new Date()
    });

    await log.save();
    res.status(200).json({ success: true, log, message: 'Food logged with automatic nutrition calculation' });
  } catch (error) {
    console.error('logMeal error:', error);
    res.status(500).json({ success: false, message: 'Server error logging meal' });
  }
};

const updateWater = async (req, res) => {
  try {
    const { amountMl, date } = req.body; // e.g. +250, -250, or exact
    const logDate = date || getTodayDateString();

    let log = await TrackingLog.findOne({ user: req.user._id, date: logDate });
    if (!log) {
      log = new TrackingLog({
        user: req.user._id,
        date: logDate,
        waterIntakeMl: 0
      });
    }

    const newAmount = Math.max(0, (log.waterIntakeMl || 0) + Number(amountMl));
    log.waterIntakeMl = newAmount;
    await log.save();

    res.status(200).json({ success: true, waterIntakeMl: log.waterIntakeMl });
  } catch (error) {
    console.error('updateWater error:', error);
    res.status(500).json({ success: false, message: 'Server error updating water intake' });
  }
};

const logWorkout = async (req, res) => {
  try {
    const { completed, skipped, skipReason, durationMinutes, notes, completedExercises, perceivedEffort, painOrDiscomfort, date } = req.body;
    const logDate = date || getTodayDateString();

    let log = await TrackingLog.findOne({ user: req.user._id, date: logDate });
    if (!log) {
      log = new TrackingLog({
        user: req.user._id,
        date: logDate
      });
    }

    if (completed !== undefined) log.workoutCompleted = Boolean(completed);
    if (skipped !== undefined) log.workoutSkipped = Boolean(skipped);
    if (skipReason !== undefined) log.skipReason = skipReason;
    if (durationMinutes !== undefined) log.workoutDurationMinutes = Number(durationMinutes);
    if (notes) log.workoutNotes = notes;
    if (perceivedEffort !== undefined) log.perceivedEffort = Number(perceivedEffort);
    if (painOrDiscomfort !== undefined) log.painOrDiscomfort = painOrDiscomfort;
    
    if (completedExercises && Array.isArray(completedExercises)) {
      log.completedExercises = completedExercises.map(ex => {
        if (typeof ex === 'string') {
          return { name: ex, sets: 3, reps: 10, weight: 0, completed: true };
        }
        return {
          name: ex.name,
          sets: Number(ex.sets) || 3,
          reps: ex.reps || 10,
          weight: Number(ex.weight) || 0,
          perceivedEffort: ex.perceivedEffort ? Number(ex.perceivedEffort) : undefined,
          painOrDiscomfort: ex.painOrDiscomfort || '',
          completed: ex.completed !== undefined ? ex.completed : true
        };
      });
    }

    await log.save();
    res.status(200).json({ success: true, log, message: 'Workout progress saved successfully' });
  } catch (error) {
    console.error('logWorkout error:', error);
    res.status(500).json({ success: false, message: 'Server error logging workout' });
  }
};

const logSleep = async (req, res) => {
  try {
    const { sleepHours, bedTime, wakeTime, sleepQuality, energyLevel, sleepNotes, date } = req.body;
    const logDate = date || getTodayDateString();

    let log = await TrackingLog.findOne({ user: req.user._id, date: logDate });
    if (!log) {
      log = new TrackingLog({ user: req.user._id, date: logDate });
    }

    // Auto calculate sleep hours from bedTime & wakeTime if crossing midnight
    let calculatedHours = sleepHours !== undefined ? Number(sleepHours) : log.sleepHours;
    if (bedTime && wakeTime && (!sleepHours || sleepHours === 0)) {
      const [bH, bM] = bedTime.split(':').map(Number);
      const [wH, wM] = wakeTime.split(':').map(Number);
      let diffMinutes = (wH * 60 + wM) - (bH * 60 + bM);
      if (diffMinutes < 0) diffMinutes += 24 * 60; // crossed midnight
      calculatedHours = Math.round((diffMinutes / 60) * 10) / 10;
    }

    log.sleepHours = Math.max(0, Math.min(24, calculatedHours));
    if (bedTime) log.bedTime = bedTime;
    if (wakeTime) log.wakeTime = wakeTime;
    if (sleepQuality) log.sleepQuality = Number(sleepQuality);
    if (energyLevel) log.energyLevel = Number(energyLevel);
    if (sleepNotes) log.sleepNotes = sleepNotes;

    await log.save();
    res.status(200).json({ success: true, log, message: 'Sleep & recovery logged successfully' });
  } catch (error) {
    console.error('logSleep error:', error);
    res.status(500).json({ success: false, message: 'Server error logging sleep' });
  }
};

const logWeight = async (req, res) => {
  try {
    const { weight, date } = req.body;
    if (!weight || weight <= 0) {
      return res.status(400).json({ success: false, message: 'Valid weight is required' });
    }

    const logDate = date || getTodayDateString();
    let log = await TrackingLog.findOne({ user: req.user._id, date: logDate });
    if (!log) {
      log = new TrackingLog({ user: req.user._id, date: logDate });
    }

    log.weight = Number(weight);
    await log.save();

    // Also update current weight on HealthProfile
    await HealthProfile.findOneAndUpdate(
      { user: req.user._id },
      { weight: Number(weight) }
    );

    res.status(200).json({ success: true, weight: log.weight, message: 'Weight logged successfully' });
  } catch (error) {
    console.error('logWeight error:', error);
    res.status(500).json({ success: false, message: 'Server error logging weight' });
  }
};

const getHistory = async (req, res) => {
  try {
    const days = Number(req.query.days) || 14;
    const logs = await TrackingLog.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(days);

    res.status(200).json({ success: true, history: logs.reverse() });
  } catch (error) {
    console.error('getHistory error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving history' });
  }
};

const logCardio = async (req, res) => {
  try {
    const {
      date,
      activityType,
      durationMinutes,
      distanceKm,
      paceMinPerKm,
      perceivedEffort,
      notes
    } = req.body;

    if (!activityType) {
      return res.status(400).json({ success: false, message: 'Activity type is required' });
    }

    const logDate = date || getTodayDateString();
    let log = await TrackingLog.findOne({ user: req.user._id, date: logDate });
    if (!log) {
      log = new TrackingLog({ user: req.user._id, date: logDate });
    }

    const duration = Number(durationMinutes) || 20;
    const profile = await HealthProfile.findOne({ user: req.user._id });
    const weight = (profile && profile.weight) ? profile.weight : 70;

    // ACSM MET lookup for calorie estimation
    const act = CARDIO_ACTIVITIES.find(a => a.name.toLowerCase() === activityType.toLowerCase() || a.id === activityType.toLowerCase());
    const met = act ? act.met : 4.5;
    const estimatedCalories = Math.round(met * weight * (duration / 60));

    const newCardioEntry = {
      activityType: act ? act.name : activityType,
      durationMinutes: duration,
      distanceKm: Number(distanceKm) || 0,
      paceMinPerKm: Number(paceMinPerKm) || 0,
      perceivedEffort: perceivedEffort ? Number(perceivedEffort) : undefined,
      estimatedCalories,
      notes: notes || '',
      completed: true,
      loggedAt: new Date()
    };

    if (!Array.isArray(log.cardioLogs)) {
      log.cardioLogs = [];
    }
    log.cardioLogs.push(newCardioEntry);
    log.cardioCompleted = true;

    await log.save();

    res.status(200).json({
      success: true,
      cardioLog: newCardioEntry,
      log,
      message: 'Cardio session recorded successfully'
    });
  } catch (error) {
    console.error('logCardio error:', error);
    res.status(500).json({ success: false, message: 'Server error logging cardio' });
  }
};

module.exports = {
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
};
