const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // A. Basic profile (Some may overlap with User, but we keep detailed here)
  age: Number,
  gender: String,
  height: Number,
  weight: Number,
  waist: Number,
  preferredUnits: {
    type: String,
    enum: ['metric', 'imperial'],
    default: 'metric'
  },
  country: String,

  // B. Fitness goals
  primaryGoal: {
    type: String,
    enum: ['build_muscle', 'gain_weight', 'lose_fat', 'improve_endurance', 'improve_strength', 'improve_flexibility', 'general_fitness', 'maintain_weight', 'improve_consistency']
  },
  secondaryGoals: [String],
  targetWeight: Number,
  preferredTimeframeWeeks: Number,

  // C. Lifestyle
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active']
  },
  averageSleepDuration: Number,
  trainingDaysPerWeek: Number,
  preferredWorkoutTime: String,
  workoutDurationMinutes: Number,
  accessToGym: Boolean,
  availableEquipment: [String],
  exerciseExperience: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  preferredTrainingStyles: [String],

  // D. Medical considerations and restrictions
  allergies: [String],
  foodIntolerances: [String],
  existingInjuries: [String],
  pastInjuries: [String],
  movementLimitations: [String],
  medicalConditions: [String],
  dietaryRestrictions: [String],

  // E. Diet preferences
  dietType: {
    type: String,
    enum: ['omnivorous', 'vegetarian', 'vegan', 'eggetarian', 'pescatarian']
  },
  preferredCuisines: [String],
  foodsDisliked: [String],
  mealFrequency: Number,
  cookingAbility: String,
  budgetPreference: String,

  onboardingCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('HealthProfile', healthProfileSchema);
