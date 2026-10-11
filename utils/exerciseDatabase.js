// Structured Exercise Reference Library with instructions, target muscles, equipment & movement restrictions
const EXERCISE_DATABASE = [
  {
    id: 'pushups',
    name: 'Push-ups',
    targetMuscles: ['Chest', 'Triceps', 'Core'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    defaultSets: 3,
    defaultReps: '12-15',
    restSeconds: 60,
    instructions: 'Keep body in a straight plank line. Lower chest to floor and push back up with elbows at 45 degrees.',
    restrictedForInjuries: ['wrist_pain', 'shoulder_impingement']
  },
  {
    id: 'bodyweight_squats',
    name: 'Bodyweight Squats',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    defaultSets: 3,
    defaultReps: '15-20',
    restSeconds: 60,
    instructions: 'Feet shoulder-width apart. Hips back and down until thighs are parallel to ground. Keep chest upright.',
    restrictedForInjuries: ['knee_pain', 'patellar_tendonitis']
  },
  {
    id: 'plank',
    name: 'Standard Forearm Plank',
    targetMuscles: ['Core', 'Transverse Abdominis', 'Shoulders'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    defaultSets: 3,
    defaultReps: '45-60 sec',
    restSeconds: 45,
    instructions: 'Rest on forearms and toes. Squeeze glutes and brace core tightly without sagging lower back.',
    restrictedForInjuries: ['lower_back_pain']
  },
  {
    id: 'glute_bridges',
    name: 'Glute Bridges',
    targetMuscles: ['Glutes', 'Hamstrings', 'Lower Back'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 45,
    instructions: 'Lie on back with knees bent. Drive through heels to raise hips toward ceiling. Squeeze glutes at top.',
    restrictedForInjuries: []
  },
  {
    id: 'lunges',
    name: 'Walking Lunges',
    targetMuscles: ['Quadriceps', 'Glutes'],
    equipment: 'Bodyweight',
    difficulty: 'Intermediate',
    defaultSets: 3,
    defaultReps: '10 per leg',
    restSeconds: 60,
    instructions: 'Step forward and lower back knee toward ground. Keep front knee behind toe line.',
    restrictedForInjuries: ['knee_pain']
  },
  {
    id: 'dumbbell_rows',
    name: 'Dumbbell Bent-Over Rows',
    targetMuscles: ['Lats', 'Rhomboids', 'Biceps'],
    equipment: 'Dumbbells',
    difficulty: 'Intermediate',
    defaultSets: 3,
    defaultReps: '10-12',
    restSeconds: 60,
    instructions: 'Hinge at hips with flat back. Pull dumbbells to hips, squeezing shoulder blades together.',
    restrictedForInjuries: ['lower_back_herniation']
  },
  {
    id: 'dumbbell_bench_press',
    name: 'Dumbbell Chest Press',
    targetMuscles: ['Chest', 'Anterior Deltoid', 'Triceps'],
    equipment: 'Dumbbells / Bench',
    difficulty: 'Intermediate',
    defaultSets: 3,
    defaultReps: '10-12',
    restSeconds: 90,
    instructions: 'Press dumbbells up above chest and lower under control with elbows tucked slightly.',
    restrictedForInjuries: ['shoulder_dislocation']
  },
  {
    id: 'overhead_shoulder_press',
    name: 'Dumbbell Overhead Shoulder Press',
    targetMuscles: ['Deltoids', 'Triceps'],
    equipment: 'Dumbbells',
    difficulty: 'Intermediate',
    defaultSets: 3,
    defaultReps: '10-12',
    restSeconds: 90,
    instructions: 'Press dumbbells vertically upward until arms are extended overhead. Avoid arching lower back.',
    restrictedForInjuries: ['rotator_cuff_tear', 'shoulder_impingement']
  },
  {
    id: 'mountain_climbers',
    name: 'Mountain Climbers',
    targetMuscles: ['Core', 'Cardiovascular', 'Hip Flexors'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    defaultSets: 3,
    defaultReps: '30 sec',
    restSeconds: 45,
    instructions: 'In high plank, alternately drive knees towards chest at a rhythmic, controlled pace.',
    restrictedForInjuries: ['wrist_pain']
  },
  {
    id: 'bird_dog',
    name: 'Bird Dog Core Stabilization',
    targetMuscles: ['Lower Back', 'Glutes', 'Core'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    defaultSets: 3,
    defaultReps: '10 each side',
    restSeconds: 30,
    instructions: 'On hands and knees, extend opposite arm and leg straight out while maintaining a neutral spine.',
    restrictedForInjuries: []
  }
];

// Generates an injury-safe workout circuit
const getSafeExercisesForProfile = (profile, count = 4) => {
  const injuries = (profile && profile.injuries) || [];
  const injuryTerms = injuries.flatMap(inj => [
    inj.bodyPart ? inj.bodyPart.toLowerCase() : '',
    ...(inj.movementsToAvoid || []).map(m => m.toLowerCase())
  ]).filter(Boolean);

  const safeList = EXERCISE_DATABASE.filter(ex => {
    // Check if any injury restriction applies
    for (const term of injuryTerms) {
      if (ex.name.toLowerCase().includes(term)) return false;
      for (const m of ex.targetMuscles) {
        if (m.toLowerCase().includes(term)) return false;
      }
      for (const r of ex.restrictedForInjuries) {
        if (r.toLowerCase().includes(term) || term.includes(r.toLowerCase())) return false;
      }
    }
    return true;
  });

  return safeList.slice(0, count).map(ex => ({
    name: ex.name,
    sets: ex.defaultSets,
    reps: ex.defaultReps,
    restSeconds: ex.restSeconds,
    targetMuscles: ex.targetMuscles,
    instructions: ex.instructions,
    equipment: ex.equipment,
    completed: false
  }));
};

module.exports = {
  EXERCISE_DATABASE,
  getSafeExercisesForProfile
};
