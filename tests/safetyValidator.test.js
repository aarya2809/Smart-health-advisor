const { validateDietPlan, validateWorkoutPlan } = require('../utils/safetyValidator');

describe('Safety Validator', () => {
  it('should pass diet plan if no allergies', () => {
    const profile = { safetyQuestionnaireCompleted: true, hasFoodAllergies: 'no' };
    const plan = { meals: [{ foodName: 'Peanut Butter' }] };
    expect(validateDietPlan(plan, profile)).toBe(true);
  });

  it('should reject diet plan if it contains an allergen', () => {
    const profile = { 
      safetyQuestionnaireCompleted: true, 
      hasFoodAllergies: 'yes',
      allergies: [{ allergen: 'peanut' }]
    };
    const plan = { meals: [{ foodName: 'Peanut Butter Jelly' }] };
    expect(() => validateDietPlan(plan, profile)).toThrow(/SAFETY_VIOLATION/);
  });

  it('should reject diet plan if it contains a food to avoid', () => {
    const profile = { 
      safetyQuestionnaireCompleted: true, 
      hasFoodAllergies: 'yes',
      allergies: [{ allergen: 'dairy', foodsToAvoid: ['cheese', 'milk'] }]
    };
    const plan = { meals: [{ foodName: 'Grilled Cheese Sandwich' }] };
    expect(() => validateDietPlan(plan, profile)).toThrow(/SAFETY_VIOLATION/);
  });

  it('should pass workout plan if no injuries', () => {
    const profile = { safetyQuestionnaireCompleted: true, hasInjuries: 'no' };
    const plan = { exercises: [{ name: 'Heavy Squat' }] };
    expect(validateWorkoutPlan(plan, profile)).toBe(true);
  });

  it('should reject workout plan if it contains a restricted movement', () => {
    const profile = { 
      safetyQuestionnaireCompleted: true, 
      hasInjuries: 'current',
      injuries: [{ movementsToAvoid: ['squat', 'lunges'] }]
    };
    const plan = { exercises: [{ name: 'Barbell Back Squat' }] };
    expect(() => validateWorkoutPlan(plan, profile)).toThrow(/SAFETY_VIOLATION/);
  });

  it('should throw if safety questionnaire is not completed', () => {
    const profile = { safetyQuestionnaireCompleted: false };
    const plan = { meals: [] };
    expect(() => validateDietPlan(plan, profile)).toThrow(/must complete safety questionnaire/);
    expect(() => validateWorkoutPlan(plan, profile)).toThrow(/must complete safety questionnaire/);
  });
});
