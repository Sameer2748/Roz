export function calculateBMR(gender, weightKg, heightCm, age) {
  if (gender === 'female') {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }
  return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
}

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export function calculateTDEE(bmr, activityLevel) {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.2));
}

export function macroCalories(proteinG, carbsG, fatG) {
  return Math.round(proteinG * 4 + carbsG * 4 + fatG * 9);
}

export function caloriePercentage(consumed, target) {
  if (!target || target === 0) return 0;
  return Math.min(Math.round((consumed / target) * 100), 200);
}

export function remaining(consumed, target) {
  return Math.max(0, target - consumed);
}
