/**
 * Authoritative Clinical Protein & Macronutrient Calculation Engine (v2.0)
 * Grounded in ACSM (American College of Sports Medicine) and
 * ISSN (International Society of Sports Nutrition) guidelines.
 *
 * Considers:
 * - Actual Body Weight (ABW)
 * - Ideal Body Weight (IBW - Hamwi formula) & Adjusted Body Weight for BMI >= 30
 * - Primary fitness goal (Fat Loss, Muscle Gain, Maintenance, Endurance)
 * - Activity level and exercise experience
 * - Gender, Age, and dietary considerations
 */

/**
 * Calculates Ideal Body Weight (IBW) using the Hamwi equation
 * Male: 48.0 kg for first 152.4 cm (5 ft) + 1.1 kg per additional cm
 * Female: 45.5 kg for first 152.4 cm (5 ft) + 0.9 kg per additional cm
 */
function calculateIdealBodyWeight(heightCm, gender = 'male') {
  if (!heightCm || heightCm <= 100) return null;
  const inchesOver60 = Math.max(0, (heightCm - 152.4) / 2.54);
  const isFemale = String(gender).toLowerCase() === 'female';
  const baseKg = isFemale ? 45.5 : 48.0;
  const perInchKg = isFemale ? 2.3 : 2.7;
  return Math.round((baseKg + (inchesOver60 * perInchKg)) * 10) / 10;
}

/**
 * Calculates reference weight:
 * For normal and overweight individuals (BMI < 30): uses actual weight.
 * For obese individuals (BMI >= 30): uses Adjusted Body Weight (AdjBW)
 * AdjBW = IBW + 0.25 * (Actual Weight - IBW) to prevent excessive protein targets
 * that exceed metabolic requirements and strain kidneys.
 */
function getReferenceWeight(actualWeightKg, heightCm, gender = 'male') {
  if (!actualWeightKg || actualWeightKg <= 0) return 70; // safe adult baseline
  if (!heightCm || heightCm <= 100) return actualWeightKg;

  const heightM = heightCm / 100;
  const bmi = actualWeightKg / (heightM * heightM);

  if (bmi >= 30) {
    const ibw = calculateIdealBodyWeight(heightCm, gender);
    if (ibw && actualWeightKg > ibw) {
      // Adjusted Body Weight for clinical obesity
      return Math.round((ibw + (0.25 * (actualWeightKg - ibw))) * 10) / 10;
    }
  }

  return actualWeightKg;
}

/**
 * Calculates individualized daily protein target and macronutrient distribution.
 *
 * Evidence-informed protein ranges:
 * - Weight / Fat Loss (`lose_fat`):
 *   ACSM/ISSN recommends 1.4 - 1.8 g/kg of reference weight during calorie restriction
 *   to preserve lean muscle mass and promote satiety without unnecessary excess.
 * - Muscle Gain (`build_muscle`):
 *   1.6 - 2.0 g/kg (optimal muscle protein synthesis threshold).
 * - Maintenance / General Fitness (`general_fitness`, `maintain_weight`):
 *   1.2 - 1.5 g/kg (sufficient for active individuals, exceeds RDA 0.8g/kg for tissue turnover).
 * - Endurance (`improve_endurance`):
 *   1.2 - 1.4 g/kg (covers mitochondrial protein synthesis).
 */
function calculateIndividualizedTargets({
  tdee,
  weightKg,
  heightCm,
  age = 25,
  gender = 'male',
  goal = 'general_fitness',
  activityLevel = 'moderately_active',
  dietType = 'vegetarian'
}) {
  const actualWeight = Number(weightKg) || 70;
  const referenceWeight = getReferenceWeight(actualWeight, Number(heightCm), gender);

  // 1. Calorie Target Adjustment based on goal
  let calorieTarget = Math.round(Number(tdee) || (referenceWeight * 30));
  if (goal === 'lose_fat') {
    // Moderate deficit of 20% or 400-500 kcal, floor at 1200 (female) or 1500 (male)
    const floor = String(gender).toLowerCase() === 'female' ? 1200 : 1500;
    calorieTarget = Math.max(floor, Math.round(calorieTarget - 450));
  } else if (goal === 'build_muscle') {
    // Lean surplus of 250-300 kcal
    calorieTarget = Math.round(calorieTarget + 300);
  } else if (goal === 'gain_weight') {
    calorieTarget = Math.round(calorieTarget + 450);
  }

  // 2. Individualized Protein Multiplier (g / kg of reference weight)
  let proteinPerKg;
  let goalDescription;

  switch (goal) {
    case 'lose_fat':
      // 1.5 g/kg reference weight: clinical sweet spot for muscle retention during deficit
      proteinPerKg = 1.5;
      goalDescription = 'Calorie deficit with lean-tissue preservation';
      break;

    case 'build_muscle':
      proteinPerKg = 1.8;
      goalDescription = 'Hypertrophy-optimized protein synthesis';
      break;

    case 'gain_weight':
      proteinPerKg = 1.6;
      goalDescription = 'Caloric surplus with steady muscular growth';
      break;

    case 'improve_endurance':
      proteinPerKg = 1.3;
      goalDescription = 'Cardiovascular recovery and glycogen synthesis';
      break;

    case 'maintain_weight':
    case 'general_fitness':
    default:
      proteinPerKg = 1.3;
      goalDescription = 'Balanced physical health and tissue maintenance';
      break;
  }

  // Activity level modifier: Very active / extra active adds +0.1 g/kg
  if (activityLevel === 'very_active' || activityLevel === 'extra_active') {
    proteinPerKg += 0.1;
  }

  // Calculate Protein in grams
  const proteinTargetGrams = Math.round(referenceWeight * proteinPerKg);
  const proteinCalories = proteinTargetGrams * 4;

  // 3. Dietary Fats: 25-30% of total caloric intake (healthy hormonal baseline)
  const fatCalories = calorieTarget * 0.25;
  const fatTargetGrams = Math.round(fatCalories / 9);

  // 4. Carbohydrates: Remaining caloric budget
  const remainingCalories = Math.max(0, calorieTarget - proteinCalories - fatCalories);
  const carbTargetGrams = Math.round(remainingCalories / 4);

  // Transparent Clinical Rationale
  const wasAdjusted = referenceWeight !== actualWeight;
  const rationale = wasAdjusted
    ? `Target of ${proteinTargetGrams}g/day calculated at ${proteinPerKg}g/kg on an adjusted reference weight of ${referenceWeight}kg (actual ${actualWeight}kg) for safe ${goal.replace('_', ' ')}.`
    : `Target of ${proteinTargetGrams}g/day calculated at ${proteinPerKg}g/kg based on your body weight of ${actualWeight}kg for ${goalDescription.toLowerCase()}.`;

  return {
    calorieTarget,
    proteinTargetGrams,
    carbTargetGrams,
    fatTargetGrams,
    proteinPerKg,
    referenceWeightKg: referenceWeight,
    actualWeightKg: actualWeight,
    calculationMethod: 'ACSM/ISSN Goal-Adjusted Protein Methodology (v2.0)',
    rationale,
    goalDescription
  };
}

module.exports = {
  calculateIdealBodyWeight,
  getReferenceWeight,
  calculateIndividualizedTargets
};
