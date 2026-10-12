const mongoose = require('mongoose');

const workoutPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  objective: String,
  estimatedDuration: Number, // in minutes
  location: {
    type: String,
    enum: ['gym', 'home', 'outdoor', 'bodyweight'],
    default: 'gym'
  },
  availableEquipment: [String],
  isCardioIncluded: {
    type: Boolean,
    default: false
  },
  cardioActivity: {
    activityType: String,
    targetDurationMinutes: Number,
    intensity: String, // 'conversational', 'moderate', 'vigorous'
    instructions: String,
    estimatedCalories: Number,
    isLowImpact: { type: Boolean, default: true }
  },
  adjustmentHistory: [{
    timestamp: { type: Date, default: Date.now },
    fromLocation: String,
    toLocation: String,
    reason: String
  }],
  exercises: [{
    name: String,
    sets: Number,
    reps: String, // e.g., "10-12" or "30 sec"
    restSeconds: Number,
    equipment: String,
    targetMuscles: [String],
    instructions: String,
    safetySubstituted: Boolean,
    originalExercise: String,
    substitutionReason: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  completed: {
    type: Boolean,
    default: false
  },
  skipped: {
    type: Boolean,
    default: false
  },
  skipReason: String,
  safetyAuditPassed: {
    type: Boolean,
    default: true
  },
  safetyNotes: [String]
}, { timestamps: true });

// Ensure one workout plan per user per day
workoutPlanSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
