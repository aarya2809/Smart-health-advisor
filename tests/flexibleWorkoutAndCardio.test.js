const {
  adaptWorkoutPlanForLocation,
  isExerciseSafeForProfile
} = require('../utils/injuryEngine');

const {
  generateCardioPrescription,
  isCardioSafeForProfile,
  CARDIO_ACTIVITIES
} = require('../utils/cardioEngine');

describe('Flexible Workout Preferences & Adaptive Location Engine', () => {
  const sampleGymPlan = {
    location: 'gym',
    objective: 'Chest & Full Body Strength',
    exercises: [
      { name: 'Barbell Flat Bench Press', equipment: 'bench', sets: 3, reps: '10' },
      { name: 'Machine Leg Press', equipment: 'gym', sets: 3, reps: '10' },
      { name: 'Standard Push-ups', equipment: 'bodyweight', sets: 3, reps: '15' }
    ]
  };

  test('switches gym workout to home, replacing gym machines with available equipment', () => {
    const profile = {
      homeEquipment: ['dumbbells', 'bodyweight'],
      injuries: []
    };

    const { adaptedPlan, replacementsCount } = adaptWorkoutPlanForLocation(
      sampleGymPlan,
      'home',
      ['dumbbells', 'bodyweight'],
      profile
    );

    expect(adaptedPlan.location).toBe('home');
    expect(replacementsCount).toBeGreaterThanOrEqual(1);

    const exerciseNames = adaptedPlan.exercises.map(e => e.name);
    // Machine leg press should be removed
    expect(exerciseNames).not.toContain('Machine Leg Press');
    // Standard push-ups are bodyweight, should be kept
    expect(exerciseNames).toContain('Standard Push-ups');

    // History should be tracked
    expect(adaptedPlan.adjustmentHistory.length).toBeGreaterThan(0);
    expect(adaptedPlan.adjustmentHistory[0].toLocation).toBe('home');
  });

  test('enforces bodyweight-only exercises when location is bodyweight', () => {
    const profile = { injuries: [] };
    const { adaptedPlan } = adaptWorkoutPlanForLocation(sampleGymPlan, 'bodyweight', [], profile);

    expect(adaptedPlan.location).toBe('bodyweight');
    adaptedPlan.exercises.forEach(ex => {
      const equip = (ex.equipment || 'bodyweight').toLowerCase();
      expect(['bodyweight', 'none']).toContain(equip);
    });
  });

  test('strictly maintains knee injury restrictions when adapting locations', () => {
    const kneeInjuryProfile = {
      homeEquipment: ['dumbbells', 'bodyweight'],
      injuries: [{ bodyPart: 'knee', status: 'current' }]
    };

    const hazardousPlan = {
      location: 'gym',
      exercises: [
        { name: 'Barbell Back Squat', equipment: 'barbell', sets: 3, reps: '10' },
        { name: 'Standard Push-ups', equipment: 'bodyweight', sets: 3, reps: '12' }
      ]
    };

    const { adaptedPlan } = adaptWorkoutPlanForLocation(
      hazardousPlan,
      'home',
      ['dumbbells', 'bodyweight'],
      kneeInjuryProfile
    );

    const exerciseNames = adaptedPlan.exercises.map(e => e.name.toLowerCase());
    expect(exerciseNames.some(n => n.includes('squat'))).toBe(false);
    expect(exerciseNames.some(n => n.includes('lunge'))).toBe(false);
    expect(exerciseNames.some(n => n.includes('press') && n.includes('leg'))).toBe(false);
  });
});

describe('Personalized Cardio Planning Engine', () => {
  const healthyProfile = { injuries: [] };
  const kneeProfile = { injuries: [{ bodyPart: 'knee', status: 'current' }] };

  test('strictly rejects high-impact running and jumping for knee injuries', () => {
    const runningCheck = isCardioSafeForProfile('Outdoor Jogging (Moderate Pace)', kneeProfile);
    expect(runningCheck.safe).toBe(false);

    const jumpRopeCheck = isCardioSafeForProfile('Jump Rope Conditioning', kneeProfile);
    expect(jumpRopeCheck.safe).toBe(false);
  });

  test('allows low-impact and zero-impact activities for knee injuries', () => {
    const walkingCheck = isCardioSafeForProfile('Brisk Walking (Flat Ground)', kneeProfile);
    expect(walkingCheck.safe).toBe(true);

    const cyclingCheck = isCardioSafeForProfile('Stationary Cycling (Low Resistance)', kneeProfile);
    expect(cyclingCheck.safe).toBe(true);

    const swimmingCheck = isCardioSafeForProfile('Swimming (Freestyle / Laps)', kneeProfile);
    expect(swimmingCheck.safe).toBe(true);
  });

  test('prescribes fat loss cardio tailored for energy balance without knee strain', () => {
    const prescription = generateCardioPrescription({
      goal: 'lose_fat',
      weightKg: 80,
      location: 'gym',
      profile: kneeProfile
    });

    expect(prescription.targetDurationMinutes).toBe(30);
    expect(prescription.isLowImpact).toBe(true);
    expect(prescription.estimatedCalories).toBeGreaterThan(0);
    expect(prescription.instructions).toContain('cardio supports heart health');
  });

  test('calculates science-based MET calories accurately', () => {
    // 80 kg * MET 3.8 * (30/60) = 152 kcal
    const prescription = generateCardioPrescription({
      goal: 'general_fitness',
      weightKg: 80,
      location: 'outdoor',
      preferredActivity: 'brisk_walking_flat',
      durationMinutes: 30,
      profile: healthyProfile
    });

    expect(prescription.estimatedCalories).toBe(152);
  });
});
