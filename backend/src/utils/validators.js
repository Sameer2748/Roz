function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateDate(dateStr) {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function validateMealType(type) {
  return ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'].includes(type);
}

function validateGoal(goal) {
  return ['fat_loss', 'muscle_gain', 'maintenance', 'slow_bulk', 'aggressive_cut'].includes(goal);
}

function validateActivityLevel(level) {
  return ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'].includes(level);
}

function validateGender(gender) {
  return ['male', 'female', 'other'].includes(gender);
}

function validateDietaryPreference(pref) {
  return ['vegetarian', 'vegan', 'non_vegetarian', 'eggetarian', 'jain', 'classic', 'pescatarian'].includes(pref);
}

function validatePace(pace) {
  const num = parseFloat(pace);
  return !isNaN(num) && num >= 0 && num <= 5.0;
}

function sanitizeNumber(val, min, max, defaultVal) {
  const num = parseFloat(val);
  if (isNaN(num)) return defaultVal;
  return Math.min(Math.max(num, min), max);
}

module.exports = {
  validateEmail,
  validateDate,
  validateMealType,
  validateGoal,
  validateActivityLevel,
  validateGender,
  validateDietaryPreference,
  validatePace,
  sanitizeNumber,
};
