/**
 * Calorie Calculator Service
 * Uses Mifflin-St Jeor equation for BMR calculation
 */

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

const MACRO_SPLITS = {
  fat_loss: { protein: 0.35, carbs: 0.35, fat: 0.30 },
  muscle_gain: { protein: 0.30, carbs: 0.45, fat: 0.25 },
  maintenance: { protein: 0.25, carbs: 0.45, fat: 0.30 },
  slow_bulk: { protein: 0.30, carbs: 0.45, fat: 0.25 },
  aggressive_cut: { protein: 0.40, carbs: 0.30, fat: 0.30 },
};

function calculateBMR(gender, weightKg, heightCm, age) {
  if (gender === 'female') {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }
  return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
}

function calculateTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

function calculateCalorieTarget(tdee, goal, pace, gender) {
  let target = tdee;

  switch (goal) {
    case 'fat_loss':
      if (pace === 'slow') target = tdee - 250;
      else if (pace === 'moderate') target = tdee - 500;
      else target = tdee - 750;
      break;
    case 'muscle_gain':
      if (pace === 'slow') target = tdee + 150;
      else if (pace === 'moderate') target = tdee + 300;
      else target = tdee + 500;
      break;
    case 'slow_bulk':
      target = tdee + 250;
      break;
    case 'aggressive_cut':
      target = tdee >= 2500 ? tdee - 1000 : tdee - 750;
      break;
    case 'maintenance':
    default:
      target = tdee;
      break;
  }

  // Minimum calorie floors
  const minCalories = gender === 'female' ? 1200 : 1500;
  return Math.max(Math.round(target), minCalories);
}

function calculateMacros(calories, goal, weightKg) {
  const split = MACRO_SPLITS[goal] || MACRO_SPLITS.maintenance;

  let proteinG = Math.round((calories * split.protein) / 4);
  let carbsG = Math.round((calories * split.carbs) / 4);
  let fatG = Math.round((calories * split.fat) / 9);

  // Protein minimum overrides
  let minProtein = 0;
  if (goal === 'muscle_gain' || goal === 'slow_bulk') {
    minProtein = Math.round(weightKg * 1.6);
  } else if (goal === 'aggressive_cut') {
    minProtein = Math.round(weightKg * 1.8);
  } else if (goal === 'fat_loss') {
    minProtein = Math.round(weightKg * 1.4);
  } else {
    minProtein = Math.round(weightKg * 1.0);
  }

  if (proteinG < minProtein) {
    proteinG = minProtein;
    const proteinCalories = proteinG * 4;
    const remainingCalories = calories - proteinCalories;
    // Redistribute remaining calories between carbs and fat
    const carbRatio = split.carbs / (split.carbs + split.fat);
    const fatRatio = split.fat / (split.carbs + split.fat);
    carbsG = Math.round((remainingCalories * carbRatio) / 4);
    fatG = Math.round((remainingCalories * fatRatio) / 9);
  }

  return { proteinG, carbsG, fatG };
}

function calculateFiber(calories) {
  const fiber = Math.round((14 * calories) / 1000);
  return Math.min(Math.max(fiber, 20), 50);
}

function calculateWater(weightKg) {
  const water = Math.round((35 * weightKg) / 250) * 250;
  return Math.min(Math.max(water, 1500), 4000);
}

function calculateFullPlan(profile) {
  const { gender, weight_kg, height_cm, age, activity_level, goal, pace } = profile;

  const bmr = calculateBMR(gender, weight_kg, height_cm, age);
  const tdee = calculateTDEE(bmr, activity_level);
  const calories = calculateCalorieTarget(tdee, goal, pace, gender);
  const { proteinG, carbsG, fatG } = calculateMacros(calories, goal, weight_kg);
  const fiberG = calculateFiber(calories);
  const waterMl = calculateWater(weight_kg);

  return {
    bmr: Math.round(bmr),
    tdee,
    calories,
    protein_g: proteinG,
    carbs_g: carbsG,
    fat_g: fatG,
    fiber_g: fiberG,
    water_ml: waterMl,
  };
}

module.exports = {
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateMacros,
  calculateFiber,
  calculateWater,
  calculateFullPlan,
};
