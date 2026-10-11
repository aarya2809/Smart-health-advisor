const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], default: 'snack' },
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fats: { type: Number, default: 0 },
  completed: { type: Boolean, default: true },
  loggedAt: { type: Date, default: Date.now }
});

const exerciseLogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: Number, default: 10 },
  weight: { type: Number, default: 0 },
  completed: { type: Boolean, default: true }
});

const trackingLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
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
  workoutDurationMinutes: {
    type: Number,
    default: 0
  },
  workoutNotes: String,
  completedExercises: [exerciseLogSchema],
  sleepHours: {
    type: Number,
    default: 0
  },
  weight: {
    type: Number
  }
}, { timestamps: true });

trackingLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('TrackingLog', trackingLogSchema);
