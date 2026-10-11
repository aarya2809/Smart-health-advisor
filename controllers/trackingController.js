const TrackingLog = require('../models/TrackingLog');
const HealthProfile = require('../models/HealthProfile');

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
        completedExercises: []
      });
    }

    res.status(200).json({ success: true, log });
  } catch (error) {
    console.error('getTodayLog error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving tracking log' });
  }
};

const logMeal = async (req, res) => {
  try {
    const { name, mealType, calories, protein, carbs, fats, date } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Meal name is required' });
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

    log.meals.push({
      name,
      mealType: mealType || 'snack',
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
      completed: true,
      loggedAt: new Date()
    });

    await log.save();
    res.status(200).json({ success: true, log, message: 'Meal logged successfully' });
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
    const { completed, durationMinutes, notes, completedExercises, date } = req.body;
    const logDate = date || getTodayDateString();

    let log = await TrackingLog.findOne({ user: req.user._id, date: logDate });
    if (!log) {
      log = new TrackingLog({
        user: req.user._id,
        date: logDate
      });
    }

    log.workoutCompleted = completed !== undefined ? completed : true;
    if (durationMinutes !== undefined) log.workoutDurationMinutes = Number(durationMinutes);
    if (notes) log.workoutNotes = notes;
    if (completedExercises && Array.isArray(completedExercises)) {
      log.completedExercises = completedExercises;
    }

    await log.save();
    res.status(200).json({ success: true, log, message: 'Workout progress saved' });
  } catch (error) {
    console.error('logWorkout error:', error);
    res.status(500).json({ success: false, message: 'Server error logging workout' });
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

module.exports = {
  getTodayLog,
  logMeal,
  updateWater,
  logWorkout,
  logWeight,
  getHistory
};
