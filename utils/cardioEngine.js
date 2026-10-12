/**
 * Authoritative Clinical Cardio Planning & Progression Engine
 * Grounded in ACSM (American College of Sports Medicine) guidelines.
 *
 * Provides:
 * - Goal-tailored cardiovascular volume (Fat Loss vs Hypertrophy vs Endurance)
 * - Strict joint & knee contraindication safety filtering (Low-impact vs High-impact)
 * - Science-based MET energy expenditure estimation
 * - Non-punitive, sustainable recovery integration
 */

const CARDIO_ACTIVITIES = [
  {
    id: 'brisk_walking_flat',
    name: 'Brisk Walking (Flat Ground)',
    category: 'walking',
    met: 3.8,
    impactLevel: 'low',
    jointsInvolved: ['hip', 'ankle'],
    contraindications: [],
    intensityGuide: 'Conversational pace — you can speak in complete sentences without gasping.',
    equipmentNeeded: 'none',
    supportedLocations: ['outdoor', 'home', 'gym']
  },
  {
    id: 'stationary_cycling_low_impact',
    name: 'Stationary Cycling (Low Resistance)',
    category: 'cycling',
    met: 5.5,
    impactLevel: 'low',
    jointsInvolved: ['hip', 'ankle'],
    contraindications: [], // Smooth closed kinetic chain, safe for mild-to-moderate knee rehab when seat height adjusted
    intensityGuide: 'Smooth, continuous pedaling at 70-85 RPM with light-to-moderate resistance.',
    equipmentNeeded: 'stationary_bike',
    supportedLocations: ['gym', 'home']
  },
  {
    id: 'elliptical_trainer',
    name: 'Elliptical Cross-Trainer',
    category: 'elliptical',
    met: 5.0,
    impactLevel: 'low',
    jointsInvolved: ['hip', 'shoulder'],
    contraindications: [],
    intensityGuide: 'Fluid, low-impact stride. Feet stay in continuous contact with pedals (zero ground impact).',
    equipmentNeeded: 'elliptical',
    supportedLocations: ['gym', 'home']
  },
  {
    id: 'swimming_freestyle',
    name: 'Swimming (Freestyle / Laps)',
    category: 'swimming',
    met: 6.0,
    impactLevel: 'zero',
    jointsInvolved: ['shoulder', 'hip'],
    contraindications: [],
    intensityGuide: 'Buoyant zero-gravity cardio. Excellent for complete joint offloading.',
    equipmentNeeded: 'pool',
    supportedLocations: ['outdoor', 'gym']
  },
  {
    id: 'low_impact_step_jacks',
    name: 'Low-Impact Step Cardio Circuit',
    category: 'bodyweight',
    met: 4.5,
    impactLevel: 'low',
    jointsInvolved: ['shoulder', 'hip'],
    contraindications: [],
    intensityGuide: 'Side-to-side steps with overhead arm reaches, no jumping or ground bounce.',
    equipmentNeeded: 'bodyweight',
    supportedLocations: ['home', 'outdoor', 'gym']
  },
  {
    id: 'outdoor_jogging',
    name: 'Outdoor Jogging (Moderate Pace)',
    category: 'running',
    met: 7.0,
    impactLevel: 'high',
    jointsInvolved: ['knee', 'ankle', 'hip', 'spine'],
    contraindications: ['knee', 'patella', 'meniscus', 'acl', 'lower_back', 'ankle'],
    intensityGuide: 'Steady rhythmic run with relaxed shoulders and midfoot strike.',
    equipmentNeeded: 'none',
    supportedLocations: ['outdoor', 'gym']
  },
  {
    id: 'treadmill_incline_walk',
    name: 'Treadmill Incline Walking',
    category: 'walking',
    met: 5.2,
    impactLevel: 'low',
    jointsInvolved: ['ankle', 'hip'],
    contraindications: ['achilles'],
    intensityGuide: '3-5% incline at 4.5-5.5 km/h. Great posterior chain activation without knee impact.',
    equipmentNeeded: 'treadmill',
    supportedLocations: ['gym', 'home']
  },
  {
    id: 'jump_rope_intervals',
    name: 'Jump Rope Conditioning',
    category: 'plyometric',
    met: 10.0,
    impactLevel: 'high',
    jointsInvolved: ['knee', 'ankle', 'patella', 'meniscus'],
    contraindications: ['knee', 'patella', 'meniscus', 'acl', 'ankle', 'lower_back'],
    intensityGuide: 'Quick repetitive bounding on balls of feet.',
    equipmentNeeded: 'jump_rope',
    supportedLocations: ['home', 'gym', 'outdoor']
  }
];

/**
 * Checks if a cardio activity is safe for user's injuries
 */
function isCardioSafeForProfile(activity, profile) {
  if (!profile || !profile.injuries || profile.injuries.length === 0) {
    return { safe: true };
  }

  const act = typeof activity === 'string'
    ? CARDIO_ACTIVITIES.find(a => a.name.toLowerCase() === activity.toLowerCase() || a.id === activity.toLowerCase())
    : activity;

  if (!act) return { safe: true };

  const injuries = profile.injuries || [];
  const hasKneeInjury = injuries.some(i => i.bodyPart && /knee|patella|meniscus|acl|pcl|mcl/i.test(i.bodyPart));
  const hasBackInjury = injuries.some(i => i.bodyPart && /back|lumbar|spine|sciatica/i.test(i.bodyPart));
  const hasAnkleInjury = injuries.some(i => i.bodyPart && /ankle|achilles/i.test(i.bodyPart));

  if (hasKneeInjury) {
    if (act.impactLevel === 'high' || act.contraindications.includes('knee')) {
      return {
        safe: false,
        reason: `'${act.name}' involves repetitive ground impacts contraindicated for knee injuries.`
      };
    }
  }

  if (hasBackInjury && act.contraindications.includes('lower_back')) {
    return {
      safe: false,
      reason: `'${act.name}' transmits vertical compressive forces to lumbar spine.`
    };
  }

  if (hasAnkleInjury && act.contraindications.includes('ankle')) {
    return {
      safe: false,
      reason: `'${act.name}' places high dynamic load on ankle / Achilles tendon.`
    };
  }

  return { safe: true };
}

/**
 * Generates an individualized cardio prescription balanced with strength and recovery
 */
function generateCardioPrescription({
  goal = 'general_fitness',
  weightKg = 70,
  location = 'gym',
  availableEquipment = [],
  profile = null,
  preferredActivity = null,
  durationMinutes = null
}) {
  const actualWeight = Number(weightKg) || 70;

  // 1. Determine safe activity candidates based on location and injury status
  const safeActivities = CARDIO_ACTIVITIES.filter(act => {
    // Filter by injury safety
    const safety = isCardioSafeForProfile(act, profile);
    if (!safety.safe) return false;

    // Filter by location suitability
    if (!act.supportedLocations.includes(location)) {
      return false;
    }

    // Filter by equipment availability if specified
    if (act.equipmentNeeded !== 'none' && act.equipmentNeeded !== 'bodyweight') {
      if (location === 'home' && !availableEquipment.includes(act.equipmentNeeded)) {
        return false;
      }
    }

    return true;
  });

  // Safe fallback if location filter was too strict
  const finalPool = safeActivities.length > 0
    ? safeActivities
    : CARDIO_ACTIVITIES.filter(a => a.impactLevel === 'low' && isCardioSafeForProfile(a, profile).safe);

  // 2. Select chosen activity
  let selected = null;
  if (preferredActivity) {
    selected = finalPool.find(a => a.id === preferredActivity || a.name.toLowerCase().includes(preferredActivity.toLowerCase()));
  }
  if (!selected) {
    selected = finalPool[0] || CARDIO_ACTIVITIES[0];
  }

  // 3. Goal-tailored duration & intensity
  let targetDuration = Number(durationMinutes);
  let intensity = 'moderate';
  let clinicalRationale = '';

  switch (goal) {
    case 'lose_fat':
      if (!targetDuration) targetDuration = 30;
      intensity = 'conversational';
      clinicalRationale = '30 minutes of Zone 2 conversational cardio optimizes fat oxidation while minimizing central nervous system fatigue.';
      break;

    case 'build_muscle':
      if (!targetDuration) targetDuration = 18;
      intensity = 'low';
      clinicalRationale = 'Low-intensity recovery cardio supports mitochondrial flushing without interfering with muscular hypertrophy protein synthesis.';
      break;

    case 'improve_endurance':
      if (!targetDuration) targetDuration = 45;
      intensity = 'moderate';
      clinicalRationale = 'Sustained aerobic conditioning to enhance maximal oxygen uptake (VO2 max) and capillary density.';
      break;

    case 'general_fitness':
    default:
      if (!targetDuration) targetDuration = 25;
      intensity = 'moderate';
      clinicalRationale = 'General cardiovascular health, metabolic efficiency, and resting heart rate improvement.';
      break;
  }

  // 4. Calculate estimated energy expenditure
  // Calories = MET * weight (kg) * (duration / 60)
  const hours = targetDuration / 60;
  const estimatedCalories = Math.round(selected.met * actualWeight * hours);

  return {
    activityType: selected.name,
    activityId: selected.id,
    targetDurationMinutes: targetDuration,
    intensity,
    instructions: `${selected.intensityGuide} Remember: cardio supports heart health and stamina—it is never punishment for food.`,
    estimatedCalories,
    isLowImpact: selected.impactLevel === 'low' || selected.impactLevel === 'zero',
    clinicalRationale,
    disclaimer: 'Energy expenditure is a science-based estimate grounded in ACSM MET averages, not a rigid metabolic burn.'
  };
}

module.exports = {
  CARDIO_ACTIVITIES,
  isCardioSafeForProfile,
  generateCardioPrescription
};
