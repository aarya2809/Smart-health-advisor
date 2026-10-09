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
  exercises: [{
    name: String,
    sets: Number,
    reps: String, // e.g., "10-12" or "30 sec"
    restSeconds: Number,
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
  skipReason: String
}, { timestamps: true });

// Ensure one workout plan per user per day
workoutPlanSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
