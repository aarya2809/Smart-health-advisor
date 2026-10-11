const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // A. Basic profile
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
    enum: ['build_muscle', 'gain_weight', 'lose_fat', 'improve_endurance', 'improve_strength', 'improve_flexibility', 'general_fitness', 'maintain_weight', 'improve_consistency'],
    default: 'general_fitness'
  },
  secondaryGoals: [String],
  targetWeight: Number,
  preferredTimeframeWeeks: Number,

  // C. Lifestyle & Schedule
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
    default: 'moderately_active'
  },
  averageSleepDuration: {
    type: Number,
    default: 8
  },
  trainingDaysPerWeek: {
    type: Number,
    default: 4
  },
  preferredWorkoutTime: {
    type: String,
    default: 'morning'
  },
  workoutDurationMinutes: {
    type: Number,
    default: 45
  },
  accessToGym: {
    type: Boolean,
    default: false
  },
  availableEquipment: [String],
  exerciseExperience: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  preferredTrainingStyles: [String],

  // D. Medical considerations and restrictions (MANDATORY SAFETY)
  safetyQuestionnaireCompleted: {
    type: Boolean,
    default: false
  },
  hasFoodAllergies: {
    type: String,
    enum: ['yes', 'no', 'unsure'],
    default: 'unsure'
  },
  allergies: [{
    allergen: String,
    type: { type: String, enum: ['allergy', 'intolerance'], default: 'allergy' },
    severity: String,
    foodsToAvoid: [String],
    clinicianAdvice: String
  }],
  hasInjuries: {
    type: String,
    enum: ['current', 'past', 'no', 'unsure'],
    default: 'unsure'
  },
  injuries: [{
    bodyPart: String,
    status: { type: String, enum: ['current', 'historical'], default: 'current' },
    aggravatingMovements: [String],
    movementsToAvoid: [String],
    clinicianAdvice: String,
    recoveryStatus: String
  }],
  medicalConditions: [String],
  dietaryRestrictions: [String],

  // E. Diet preferences (Vegetarian by default for all new profiles)
  dietType: {
    type: String,
    enum: ['vegetarian', 'vegan', 'eggetarian', 'pescatarian', 'non_vegetarian', 'omnivorous'],
    default: 'vegetarian'
  },
  preferredCuisines: [String],
  foodsDisliked: [String],
  mealFrequency: {
    type: Number,
    default: 3
  },
  cookingAbility: String,
  budgetPreference: String,

  onboardingCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('HealthProfile', healthProfileSchema);
