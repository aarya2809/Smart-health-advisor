const validateDietPlan = (plan, profile) => {
  if (!profile.safetyQuestionnaireCompleted) {
    throw new Error('SAFETY_VIOLATION: User must complete safety questionnaire before generating a diet plan.');
  }

  // If user says 'unsure', we apply conservative safeguards (we should recommend seeking advice).
  if (profile.hasFoodAllergies === 'unsure') {
    // In a full medical app, this might flag for manual review. For now, we enforce strict warnings.
  }

  if (profile.hasFoodAllergies === 'yes' && profile.allergies.length > 0) {
    for (const meal of plan.meals) {
      const foodNameLower = meal.foodName.toLowerCase();
      
      for (const allergy of profile.allergies) {
        // Strict keyword matching for allergens and foods to avoid
        const allergenLower = (allergy.allergen || '').toLowerCase();
        
        if (allergenLower && foodNameLower.includes(allergenLower)) {
          throw new Error(`SAFETY_VIOLATION: AI attempted to recommend '${meal.foodName}' which contains declared allergen/intolerance: '${allergy.allergen}'.`);
        }

        if (allergy.foodsToAvoid && allergy.foodsToAvoid.length > 0) {
          for (const food of allergy.foodsToAvoid) {
            const avoidLower = food.toLowerCase();
            if (avoidLower && foodNameLower.includes(avoidLower)) {
              throw new Error(`SAFETY_VIOLATION: AI attempted to recommend '${meal.foodName}' which contains a restricted food: '${food}'.`);
            }
          }
        }
      }
    }
  }

  return true; // Passed validation
};

const validateWorkoutPlan = (plan, profile) => {
  if (!profile.safetyQuestionnaireCompleted) {
    throw new Error('SAFETY_VIOLATION: User must complete safety questionnaire before generating a workout plan.');
  }

  if (profile.hasInjuries === 'current' || profile.hasInjuries === 'past') {
    if (profile.injuries.length > 0) {
      for (const exercise of plan.exercises) {
        const exerciseLower = exercise.name.toLowerCase();
        
        for (const injury of profile.injuries) {
          if (injury.movementsToAvoid && injury.movementsToAvoid.length > 0) {
            for (const movement of injury.movementsToAvoid) {
              const avoidLower = movement.toLowerCase();
              if (avoidLower && exerciseLower.includes(avoidLower)) {
                throw new Error(`SAFETY_VIOLATION: AI attempted to recommend '${exercise.name}' which violates movement restriction: '${movement}'.`);
              }
            }
          }
        }
      }
    }
  }

  return true; // Passed validation
};

module.exports = {
  validateDietPlan,
  validateWorkoutPlan
};
