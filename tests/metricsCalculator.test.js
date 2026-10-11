const {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateTargets
} = require('../utils/metricsCalculator');

describe('Health Metrics & Energy Calculator', () => {
  describe('BMI Calculation', () => {
    test('calculates normal BMI accurately', () => {
      // 70 kg, 175 cm => 70 / (1.75^2) = 22.86 -> 22.9
      const result = calculateBMI(70, 175);
      expect(result).not.toBeNull();
      expect(result.value).toBe(22.9);
      expect(result.category).toBe('Normal weight');
    });

    test('identifies overweight category', () => {
      // 85 kg, 170 cm => 85 / (1.70^2) = 29.4
      const result = calculateBMI(85, 170);
      expect(result.category).toBe('Overweight');
    });

    test('returns null for missing or invalid inputs', () => {
      expect(calculateBMI(0, 170)).toBeNull();
      expect(calculateBMI(70, 0)).toBeNull();
      expect(calculateBMI(null, null)).toBeNull();
    });
  });

  describe('BMR Calculation (Mifflin-St Jeor)', () => {
    test('calculates BMR for male accurately', () => {
      // Male, 25 years, 75 kg, 180 cm:
      // (10 * 75) + (6.25 * 180) - (5 * 25) + 5 = 750 + 1125 - 125 + 5 = 1755
      const result = calculateBMR(75, 180, 25, 'male');
      expect(result).not.toBeNull();
      expect(result.value).toBe(1755);
      expect(result.method).toContain('Mifflin-St Jeor');
    });

    test('calculates BMR for female accurately', () => {
      // Female, 30 years, 60 kg, 165 cm:
      // (10 * 60) + (6.25 * 165) - (5 * 30) - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
      const result = calculateBMR(60, 165, 30, 'female');
      expect(result).not.toBeNull();
      expect(result.value).toBe(1320);
    });
  });

  describe('TDEE Calculation', () => {
    test('applies sedentary multiplier (1.2)', () => {
      const result = calculateTDEE(1700, 'sedentary');
      expect(result.value).toBe(Math.round(1700 * 1.2));
    });

    test('applies moderately_active multiplier (1.55)', () => {
      const result = calculateTDEE(1700, 'moderately_active');
      expect(result.value).toBe(Math.round(1700 * 1.55));
    });
  });

  describe('Calorie & Macro Targets', () => {
    test('applies deficit for lose_fat', () => {
      const targets = calculateTargets(2500, 80, 'lose_fat');
      expect(targets.calorieTarget).toBe(2000); // 2500 - 500
      expect(targets.proteinTargetGrams).toBe(160); // 80 * 2.0g
    });

    test('applies surplus for build_muscle', () => {
      const targets = calculateTargets(2500, 75, 'build_muscle');
      expect(targets.calorieTarget).toBe(2800); // 2500 + 300
    });
  });
});
