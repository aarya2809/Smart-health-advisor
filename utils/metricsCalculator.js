/**
 * Health Metrics & Energy Calculator
 * Calculates BMI, BMR (Mifflin-St Jeor), TDEE, and Macronutrient Targets
 */

function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  let category = 'Normal weight';
  let color = '#2E7D32'; // green

  if (bmi < 18.5) {
    category = 'Underweight';
    color = '#0288D1'; // blue
  } else if (bmi < 25.0) {
    category = 'Normal weight';
    color = '#2E7D32'; // green
  } else if (bmi < 30.0) {
    category = 'Overweight';
    color = '#F57C00'; // orange
  } else {
    category = 'Obese';
    color = '#D32F2F'; // red
  }

  return {
    value: bmi,
    category,
    color,
    disclaimer: 'BMI is an indicator and screening tool, not a direct measurement of body fat or muscular composition.'
  };
}

function calculateBMR(weightKg, heightCm, age, gender) {
  if (!weightKg || !heightCm || !age || weightKg <= 0 || heightCm <= 0 || age <= 0) {
    return null;
  }

  // Mifflin-St Jeor Equation
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  const isFemale = gender && gender.toLowerCase().startsWith('f');
  const bmr = isFemale ? Math.round(base - 161) : Math.round(base + 5);

  return {
    value: bmr,
    unit: 'kcal/day',
    method: 'Mifflin-St Jeor Equation',
    description: 'Estimated resting energy expenditure burned at complete rest.'
  };
}

function calculateTDEE(bmr, activityLevel) {
  if (!bmr || bmr <= 0) return null;

  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9
  };

  const multiplier = multipliers[activityLevel] || 1.375;
  const tdee = Math.round(bmr * multiplier);

  return {
    value: tdee,
    multiplier,
    activityLevel: activityLevel || 'moderately_active',
    unit: 'kcal/day',
    description: 'Total daily energy expenditure to maintain current weight.'
  };
}

const { calculateIndividualizedTargets } = require('./proteinCalculator');

function calculateTargets(tdee, weightKg, goal, heightCm = 170, age = 25, gender = 'male', activityLevel = 'moderately_active', dietType = 'vegetarian') {
  if (!tdee || tdee <= 0) return null;

  return calculateIndividualizedTargets({
    tdee,
    weightKg,
    heightCm,
    age,
    gender,
    goal,
    activityLevel,
    dietType
  });
}

module.exports = {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateTargets,
  calculateIndividualizedTargets
};
