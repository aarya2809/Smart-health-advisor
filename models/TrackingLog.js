const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], default: 'snack' },
  portion: { type: String, default: '1 serving' },
  portionGrams: { type: Number, default: 100 },
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fats: { type: Number, default: 0 },
  isEstimated: { type: Boolean, default: true },
  completed: { type: Boolean, default: true },
  loggedAt: { type: Date, default: Date.now }
});

const exerciseLogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: mongoose.Schema.Types.Mixed, default: 10 }, // number or string like '10-12'
  weight: { type: Number, default: 0 },
  targetMuscles: [String],
  perceivedEffort: { type: Number, min: 1, max: 10 }, // RPE rating 1-10
  painOrDiscomfort: { type: String, default: '' },
  completed: { type: Boolean, default: true }
});

const trackingLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD local format
    required: true
  },
  waterIntakeMl: {
    type: Number,
    default: 0
  },
  waterTargetMl: {
    type: Number,
    default: 2500
  },
  meals: [mealLogSchema],
  workoutCompleted: {
    type: Boolean,
    default: false
  },
  workoutSkipped: {
    type: Boolean,
    default: false
  },
  skipReason: {
    type: String,
    default: ''
  },
  workoutDurationMinutes: {
    type: Number,
    default: 0
  },
  workoutNotes: String,
  completedExercises: [exerciseLogSchema],
  perceivedEffort: {
    type: Number,
    min: 1,
    max: 10
  },
  painOrDiscomfort: {
    type: String,
    default: ''
  },
  cardioCompleted: {
    type: Boolean,
    default: false
  },
  cardioLogs: [{
    activityType: { type: String, required: true },
    durationMinutes: { type: Number, default: 0 },
    distanceKm: { type: Number, default: 0 },
    paceMinPerKm: Number,
    perceivedEffort: { type: Number, min: 1, max: 10 },
    estimatedCalories: Number,
    notes: String,
    completed: { type: Boolean, default: true },
    loggedAt: { type: Date, default: Date.now }
  }],
  sleepHours: {
    type: Number,
    default: 0
  },
  bedTime: String, // e.g. "23:00"
  wakeTime: String, // e.g. "07:00"
  sleepQuality: {
    type: Number,
    min: 1,
    max: 5
  },
  energyLevel: {
    type: Number,
    min: 1,
    max: 5
  },
  sleepNotes: String,
  weight: {
    type: Number
  }
}, { timestamps: true });

trackingLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('TrackingLog', trackingLogSchema);
