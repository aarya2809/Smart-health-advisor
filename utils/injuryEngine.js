const { EXERCISE_DATABASE } = require('./exerciseDatabase');

/**
 * Anatomical and biomechanical synonym dictionaries
 */
const INJURY_KEYWORD_MAP = {
  knee: [
    'knee', 'knees', 'patella', 'patellar', 'meniscus', 'acl', 'pcl', 'mcl',
    'quadriceps_tendon', 'runner\'s knee', 'jumper\'s knee', 'knee_flexion',
    'knee_loading', 'squat', 'lunge', 'jump', 'plyometric'
  ],
  shoulder: [
    'shoulder', 'rotator_cuff', 'impingement', 'deltoid', 'labrum', 'ac_joint',
    'overhead_press', 'bench_press'
  ],
  lower_back: [
    'lower_back', 'back', 'lumbar', 'spine', 'spinal', 'disc', 'herniation',
    'sciatica', 'bent_over'
  ],
  wrist: [
    'wrist', 'carpal', 'hand'
  ],
  ankle: [
    'ankle', 'achilles', 'foot', 'plantar'
  ]
};

/**
 * Extracts and normalizes all declared injury terms from a health profile
 */
function extractUserInjuryTerms(profile) {
  if (!profile) return [];
  const terms = new Set();

  const injuries = profile.injuries || [];
  for (const inj of injuries) {
    if (inj.bodyPart) {
      const part = inj.bodyPart.trim().toLowerCase();
      terms.add(part);

      // Add related anatomical synonyms
      for (const [key, synonyms] of Object.entries(INJURY_KEYWORD_MAP)) {
        if (part.includes(key) || key.includes(part)) {
          synonyms.forEach(s => terms.add(s));
        }
      }
    }

    if (Array.isArray(inj.movementsToAvoid)) {
      inj.movementsToAvoid.forEach(m => m && terms.add(m.trim().toLowerCase()));
    }

    if (Array.isArray(inj.aggravatingMovements)) {
      inj.aggravatingMovements.forEach(m => m && terms.add(m.trim().toLowerCase()));
    }
  }

  return Array.from(terms);
}

/**
 * Checks if a specific exercise is safe for the given health profile
 */
function isExerciseSafeForProfile(exerciseInput, profile) {
  if (!profile) return { safe: true };

  const injuryTerms = extractUserInjuryTerms(profile);
  if (injuryTerms.length === 0) return { safe: true };

  const hasKneeInjury = injuryTerms.some(t =>
    ['knee', 'knees', 'patella', 'meniscus', 'acl', 'pcl'].includes(t)
  );

  const hasShoulderInjury = injuryTerms.some(t =>
    ['shoulder', 'rotator_cuff', 'impingement'].includes(t)
  );

  const hasBackInjury = injuryTerms.some(t =>
    ['lower_back', 'back', 'lumbar', 'spine', 'herniation'].includes(t)
  );

  // Normalize exercise object
  let exName = '';
  let dbMatch = null;

  if (typeof exerciseInput === 'string') {
    exName = exerciseInput;
    dbMatch = EXERCISE_DATABASE.find(e =>
      e.name.toLowerCase() === exName.toLowerCase() ||
      e.id.toLowerCase() === exName.toLowerCase()
    );
  } else if (exerciseInput && typeof exerciseInput === 'object') {
    exName = exerciseInput.name || '';
    dbMatch = EXERCISE_DATABASE.find(e =>
      e.name.toLowerCase() === exName.toLowerCase() ||
      e.id === exerciseInput.id
    );
  }

  const nameLower = exName.toLowerCase();

  // 1. STRICT KNEE RESTRICTION ENFORCEMENT
  if (hasKneeInjury) {
    // Check known database contraindications
    if (dbMatch) {
      if (dbMatch.contraindications && dbMatch.contraindications.some(c => INJURY_KEYWORD_MAP.knee.includes(c))) {
        return {
          safe: false,
          reason: `Exercise '${exName}' contraindicated due to knee mechanical load.`
        };
      }
      if (dbMatch.jointsInvolved && dbMatch.jointsInvolved.includes('knee')) {
        return {
          safe: false,
          reason: `Exercise '${exName}' articulates the knee joint.`
        };
      }
      if (dbMatch.movementPatterns && dbMatch.movementPatterns.some(p => ['knee_flexion', 'knee_loading', 'high_impact', 'jumping'].includes(p))) {
        return {
          safe: false,
          reason: `Exercise '${exName}' involves knee-loading or high impact.`
        };
      }
    }

    // Pattern matching against exercise names (protects against AI-invented or external exercises)
    const kneePatterns = [
      /\bsquat\b/i, /\bsquats\b/i, /\blunge\b/i, /\blunges\b/i, /\bjump\b/i, /\bjumps\b/i,
      /\bjumping\b/i, /\bleg press\b/i, /\bleg extension\b/i, /\bbox jump\b/i, /\bstep[- ]?up\b/i,
      /\bmountain climber\b/i, /\bburpee\b/i, /\bhigh knees\b/i, /\bskater\b/i, /\bplyo\b/i
    ];

    for (const pat of kneePatterns) {
      if (pat.test(nameLower)) {
        return {
          safe: false,
          reason: `Movement '${exName}' requires knee joint flexion or ground-impact shear.`
        };
      }
    }
  }

  // 2. STRICT SHOULDER RESTRICTION ENFORCEMENT
  if (hasShoulderInjury) {
    if (dbMatch && dbMatch.contraindications.includes('shoulder')) {
      return { safe: false, reason: `Exercise '${exName}' places shear stress on the shoulder complex.` };
    }
    const shoulderPatterns = [
      /\boverhead press\b/i, /\bmilitary press\b/i, /\bshoulder press\b/i, /\bdip\b/i, /\bdips\b/i,
      /\bupright row\b/i, /\bbehind the neck\b/i
    ];
    for (const pat of shoulderPatterns) {
      if (pat.test(nameLower)) {
        return { safe: false, reason: `Movement '${exName}' contraindicated for declared shoulder injury.` };
      }
    }
  }

  // 3. STRICT LOWER BACK RESTRICTION ENFORCEMENT
  if (hasBackInjury) {
    if (dbMatch && dbMatch.contraindications.includes('lower_back')) {
      return { safe: false, reason: `Exercise '${exName}' places axial or shear loading on lumbar spine.` };
    }
    const backPatterns = [
      /\bdeadlift\b/i, /\bgood morning\b/i, /\bbarbell bent-over\b/i, /\bsit-up\b/i
    ];
    for (const pat of backPatterns) {
      if (pat.test(nameLower)) {
        return { safe: false, reason: `Movement '${exName}' contraindicated for declared spinal/lumbar restriction.` };
      }
    }
  }

  // 4. Custom user movements to avoid
  for (const term of injuryTerms) {
    if (term.length >= 3 && nameLower.includes(term)) {
      return { safe: false, reason: `Exercise matches declared avoidance keyword '${term}'.` };
    }
  }

  return { safe: true };
}

/**
 * Returns a list of guaranteed safe exercises from the clinical database
 */
function getSafeExercisesForProfile(profile, count = 4) {
  const safePool = EXERCISE_DATABASE.filter(ex => isExerciseSafeForProfile(ex, profile).safe);

  // If filtered pool is small, safely wrap or return all available
  const selected = safePool.slice(0, count);

  return selected.map(ex => ({
    name: ex.name,
    sets: ex.defaultSets,
    reps: ex.defaultReps,
    restSeconds: ex.restSeconds,
    targetMuscles: ex.targetMuscles,
    instructions: ex.instructions,
    equipment: ex.equipment,
    completed: false
  }));
}

/**
 * Revalidates and sanitizes a workout plan against the user's latest health profile.
 * Substitutes contraindicated exercises with verified safe alternatives in-place.
 */
function sanitizeWorkoutPlan(plan, profile) {
  if (!plan || !Array.isArray(plan.exercises)) {
    return { sanitizedPlan: plan, substitutionsMade: 0, notes: [] };
  }

  const notes = [];
  let substitutionsMade = 0;

  const safePool = EXERCISE_DATABASE.filter(ex => isExerciseSafeForProfile(ex, profile).safe);
  let safePoolIdx = 0;

  const sanitizedExercises = plan.exercises.map(ex => {
    const safetyCheck = isExerciseSafeForProfile(ex, profile);
    if (safetyCheck.safe) {
      return ex;
    }

    substitutionsMade++;
    // Pick an alternative not already in the plan
    const currentNames = plan.exercises.map(e => e.name.toLowerCase());
    const replacement = safePool.find(sp => !currentNames.includes(sp.name.toLowerCase())) || safePool[safePoolIdx % safePool.length];
    safePoolIdx++;

    const note = `Replaced '${ex.name}' with '${replacement.name}' (${safetyCheck.reason})`;
    notes.push(note);

    return {
      name: replacement.name,
      sets: ex.sets || replacement.defaultSets,
      reps: ex.reps || replacement.defaultReps,
      restSeconds: ex.restSeconds || replacement.restSeconds,
      targetMuscles: replacement.targetMuscles,
      instructions: replacement.instructions,
      equipment: replacement.equipment,
      completed: false,
      safetySubstituted: true,
      originalExercise: ex.name,
      substitutionReason: safetyCheck.reason
    };
  });

  const sanitizedPlan = {
    ...plan.toObject ? plan.toObject() : plan,
    exercises: sanitizedExercises,
    safetyAuditPassed: true,
    safetyNotes: notes
  };

  return {
    sanitizedPlan,
    substitutionsMade,
    notes
  };
}

/**
 * Adapts an existing workout plan to a new location (e.g., Gym -> Home or Home -> Gym)
 * Replaces equipment-incompatible exercises with available, injury-safe alternatives.
 */
function adaptWorkoutPlanForLocation(plan, targetLocation = 'home', userAvailableEquipment = [], profile = null) {
  if (!plan || !Array.isArray(plan.exercises)) {
    return { adaptedPlan: plan, replacementsCount: 0, notes: [] };
  }

  const notes = [];
  let replacementsCount = 0;
  const oldLocation = plan.location || 'gym';

  // Determine permitted equipment set for the target location
  const isGym = targetLocation === 'gym';
  const isBodyweight = targetLocation === 'bodyweight';
  const isOutdoor = targetLocation === 'outdoor';

  const defaultHomeEquip = ['dumbbells', 'bodyweight', 'resistance_band', 'floor'];
  const userEquip = (userAvailableEquipment && userAvailableEquipment.length > 0)
    ? userAvailableEquipment
    : (profile?.homeEquipment || defaultHomeEquip);

  // Helper to check if an exercise is allowed by equipment at target location
  const isEquipmentAvailable = (ex) => {
    if (isGym) return true; // Gym has all standard equipment
    const dbMatch = EXERCISE_DATABASE.find(e => e.name.toLowerCase() === (ex.name || '').toLowerCase());
    const equip = (ex.equipment || (dbMatch && dbMatch.equipment) || 'bodyweight').toLowerCase();

    if (isBodyweight) {
      return equip === 'bodyweight' || equip === 'none';
    }
    if (isOutdoor) {
      return equip === 'bodyweight' || equip === 'none' || equip === 'running';
    }
    // Target location is Home
    if (equip === 'gym' || equip === 'machine' || equip === 'cable' || equip === 'cables') {
      return false; // Standard home lacks commercial cable machines and leg presses
    }
    if (equip === 'barbell' && !userEquip.includes('barbells') && !userEquip.includes('barbell')) {
      return false;
    }
    if (equip === 'bench' && !userEquip.includes('bench')) {
      return false;
    }
    return true;
  };

  const adaptedExercises = plan.exercises.map(ex => {
    // 1. Check if exercise is already valid for equipment and injury
    const equipOk = isEquipmentAvailable(ex);
    const safetyCheck = isExerciseSafeForProfile(ex, profile);

    if (equipOk && safetyCheck.safe) {
      return ex;
    }

    // 2. Needs replacement
    replacementsCount++;
    const reason = !equipOk
      ? `Requires gym equipment unavailable for ${targetLocation} session`
      : safetyCheck.reason;

    // Find candidate matching target location equipment AND passing injury check
    const candidate = EXERCISE_DATABASE.find(candidateEx => {
      // Must be safe for injury
      if (!isExerciseSafeForProfile(candidateEx, profile).safe) return false;
      // Must be compatible with target location equipment
      if (!isEquipmentAvailable(candidateEx)) return false;
      // Should not be identical to existing exercises
      const alreadyInPlan = plan.exercises.some(e => e.name.toLowerCase() === candidateEx.name.toLowerCase());
      return !alreadyInPlan;
    }) || EXERCISE_DATABASE.find(c => isEquipmentAvailable(c) && isExerciseSafeForProfile(c, profile).safe);

    if (candidate) {
      const note = `Adapted '${ex.name}' -> '${candidate.name}' (${reason})`;
      notes.push(note);

      return {
        name: candidate.name,
        sets: ex.sets || candidate.defaultSets,
        reps: ex.reps || candidate.defaultReps,
        restSeconds: ex.restSeconds || candidate.restSeconds,
        equipment: candidate.equipment,
        targetMuscles: candidate.targetMuscles,
        instructions: candidate.instructions,
        safetySubstituted: true,
        originalExercise: ex.name,
        substitutionReason: reason,
        completed: false
      };
    }

    return ex;
  });

  const adjustmentEntry = {
    timestamp: new Date(),
    fromLocation: oldLocation,
    toLocation: targetLocation,
    reason: `Switched location to ${targetLocation} (${replacementsCount} exercises adapted)`
  };

  const existingHistory = Array.isArray(plan.adjustmentHistory) ? plan.adjustmentHistory : [];

  const adaptedPlan = {
    ...plan.toObject ? plan.toObject() : plan,
    location: targetLocation,
    exercises: adaptedExercises,
    adjustmentHistory: [...existingHistory, adjustmentEntry],
    safetyAuditPassed: true,
    safetyNotes: [...(plan.safetyNotes || []), ...notes]
  };

  return {
    adaptedPlan,
    replacementsCount,
    notes
  };
}

module.exports = {
  extractUserInjuryTerms,
  isExerciseSafeForProfile,
  getSafeExercisesForProfile,
  sanitizeWorkoutPlan,
  adaptWorkoutPlanForLocation
};
