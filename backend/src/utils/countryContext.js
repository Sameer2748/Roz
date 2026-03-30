const COUNTRY_CONTEXTS = {
  IN: `Indian cooking almost always uses a base of onion, tomato, garlic, ginger and oil/ghee. Every vegetable curry assumes: 1 tsp oil or ghee per serving, 1 medium onion, 1 medium tomato. Ghee is commonly used on rotis (assume 0.5 tsp per roti if not specified). Dal assumes a ghee tadka. Paneer dishes assume full-fat paneer (265 kcal/100g). Curd is full-fat unless stated. Street food like samosa has ~150 kcal each, vada pav ~300 kcal. Biryani: 1 plate (~350g) = ~500-600 kcal. If user says 'sabzi' it means a vegetable curry.`,

  PK: `Pakistani cuisine uses heavy oil, ghee, and cream. Assume generous oil (1-2 tbsp per serving for curries). Naan is larger than Indian naan (~300 kcal each). Nihari and haleem are high-calorie dishes. Biryani portions are large (~700-800 kcal per plate).`,

  US: `American portions are large. A standard restaurant burger is 500-700 kcal. Pizza slice: 250-300 kcal. Fast food assumptions follow USDA values. Cups and ounces are common — 1 cup cooked pasta = 220 kcal.`,

  GB: `UK portions are moderate. Full English breakfast: ~800-1000 kcal. Fish and chips: ~800 kcal. Assume medium portions unless stated.`,

  BD: `Similar to Indian cuisine but uses more mustard oil. Rice portions are large (1 plate = 300g rice = 390 kcal). Hilsa fish curry is common.`,

  AE: `Middle Eastern and South Asian mix. Shawarma plate ~600 kcal. Hummus 100g = 170 kcal. Arabic bread 1 piece = 120 kcal. Biryani and Indian food common.`,

  CA: `North American portions similar to US. Poutine ~700 kcal. Tim Hortons double-double coffee ~230 kcal. Use USDA values for standard items.`,

  AU: `Australian portions moderate to large. Meat pie ~450 kcal. Flat white coffee ~120 kcal. Avocado toast ~350 kcal.`,
};

const COUNTRY_NAMES = {
  IN: 'India', PK: 'Pakistan', US: 'United States', GB: 'United Kingdom',
  BD: 'Bangladesh', AE: 'United Arab Emirates', CA: 'Canada', AU: 'Australia',
  NP: 'Nepal', LK: 'Sri Lanka', MY: 'Malaysia', SG: 'Singapore',
  DE: 'Germany', FR: 'France', JP: 'Japan', KR: 'South Korea',
  CN: 'China', TH: 'Thailand', VN: 'Vietnam', MX: 'Mexico',
  BR: 'Brazil', SA: 'Saudi Arabia', ZA: 'South Africa', NG: 'Nigeria',
};

function getCountryContext(countryCode) {
  return COUNTRY_CONTEXTS[countryCode] ||
    'Use standard USDA nutritional values. Assume medium portions unless specified. Account for local cooking methods and common oils/fats used in this region.';
}

function getCountryName(countryCode) {
  return COUNTRY_NAMES[countryCode] || countryCode;
}

module.exports = { getCountryContext, getCountryName };
