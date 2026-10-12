const {
  extractUserInjuryTerms,
  isExerciseSafeForProfile,
  getSafeExercisesForProfile,
  sanitizeWorkoutPlan
} = require('../utils/injuryEngine');

describe('Clinical Injury Engine & Exercise Safety Restriction', () => {
  const kneeInjuryProfile = {
    injuries: [
      {
        bodyPart: 'knee',
        description: 'Patellofemoral pain syndrome / meniscus wear',
        severity: 'moderate'
      }
    ]
  };

  const healthyProfile = {
    injuries: []
  };

  describe('extractUserInjuryTerms', () => {
    test('extracts knee anatomical terms and biomechanical synonyms', () => {
      const terms = extractUserInjuryTerms(kneeInjuryProfile);
      expect(terms).toContain('knee');
      expect(terms).toContain('patella');
      expect(terms).toContain('squat');
      expect(terms).toContain('lunge');
    });

    test('returns empty array for injury-free profile', () => {
      const terms = extractUserInjuryTerms(healthyProfile);
      expect(terms).toEqual([]);
    });
  });

  describe('isExerciseSafeForProfile', () => {
    test('rejects high knee-flexion and shear exercises for knee injuries', () => {
      const dangerousExercises = [
        'Barbell Back Squat',
        'Goblet Squat',
        'Walking Lunges',
        'Leg Press',
        'Jump Squats',
        'Box Jumps'
      ];

      dangerousExercises.forEach(name => {
        const check = isExerciseSafeForProfile(name, kneeInjuryProfile);
        expect(check.safe).toBe(false);
        expect(check.reason).toBeDefined();
      });
    });

    test('allows safe low-impact / posterior chain exercises for knee injuries', () => {
      const safeExercises = [
        'Glute Bridge',
        'Straight Leg Raise',
        'Clamshells',
        'Push-ups',
        'Dumbbell Bicep Curl',
        'Seated Cable Row'
      ];

      safeExercises.forEach(name => {
        const check = isExerciseSafeForProfile(name, kneeInjuryProfile);
        expect(check.safe).toBe(true);
      });
    });

    test('allows all exercises for healthy profile', () => {
      const check = isExerciseSafeForProfile('Barbell Back Squat', healthyProfile);
      expect(check.safe).toBe(true);
    });
  });

  describe('sanitizeWorkoutPlan', () => {
    test('automatically substitutes knee-compromising exercises with safe alternatives', () => {
      const hazardousPlan = {
        title: 'Lower Body Strength',
        exercises: [
          { name: 'Barbell Back Squat', sets: 3, reps: 10 },
          { name: 'Walking Lunges', sets: 3, reps: 12 },
          { name: 'Glute Bridge', sets: 3, reps: 15 }
        ]
      };

      const result = sanitizeWorkoutPlan(hazardousPlan, kneeInjuryProfile);
      expect(result.substitutionsMade).toBe(2);
      expect(result.sanitizedPlan.exercises).toHaveLength(3);

      const exerciseNames = result.sanitizedPlan.exercises.map(e => e.name);
      expect(exerciseNames).not.toContain('Barbell Back Squat');
      expect(exerciseNames).not.toContain('Walking Lunges');
      expect(exerciseNames).toContain('Glute Bridge');

      // Check substitution metadata
      const substituted = result.sanitizedPlan.exercises.filter(e => e.safetySubstituted);
      expect(substituted.length).toBe(2);
      expect(substituted[0].originalExercise).toBe('Barbell Back Squat');
      expect(substituted[0].substitutionReason).toBeDefined();
    });
  });
});
