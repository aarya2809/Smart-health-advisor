const mongoose = require('mongoose');

const dietPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  targetCalories: Number,
  targetProtein: Number, // in grams
  targetCarbs: Number, // in grams
  targetFats: Number, // in grams
  dietType: {
    type: String,
    default: 'vegetarian'
  },
  calculationMethod: String,
  rationale: String,
  referenceWeightKg: Number,
  meals: [{
    type: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack']
    },
    foodName: String,
    portion: String,
    estimatedCalories: Number,
    estimatedProtein: Number,
    completed: {
      type: Boolean,
      default: false
    }
  }]
}, { timestamps: true });

// Ensure one plan per user per day
dietPlanSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DietPlan', dietPlanSchema);
