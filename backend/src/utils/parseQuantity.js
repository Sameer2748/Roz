/**
 * Extract quantity and unit hints from free-text food descriptions
 */

const PATTERNS = [
  // "2 rotis", "3 chapatis"
  { regex: /(\d+\.?\d*)\s*(rotis?|chapatis?|parathas?|naans?|puris?|idlis?|dosas?|samosas?|vadas?)/i, type: 'count' },
  // "250ml", "500 ml"
  { regex: /(\d+\.?\d*)\s*ml/i, type: 'ml' },
  // "100g", "200 grams"
  { regex: /(\d+\.?\d*)\s*(g|grams?)/i, type: 'grams' },
  // "1 cup", "2 cups"
  { regex: /(\d+\.?\d*)\s*cups?/i, type: 'cup' },
  // "half bowl", "1 bowl", "2 bowls"
  { regex: /(half|quarter|\d+\.?\d*)\s*(small|medium|large)?\s*bowls?/i, type: 'bowl' },
  // "half plate", "1 plate"
  { regex: /(half|quarter|\d+\.?\d*)\s*(small|medium|large)?\s*plates?/i, type: 'plate' },
  // "half kg", "1 kg"
  { regex: /(\d+\.?\d*|half|quarter)\s*kg/i, type: 'kg' },
  // "1 glass", "2 glasses"
  { regex: /(\d+\.?\d*)\s*glass(?:es)?/i, type: 'glass' },
  // "1 slice", "2 slices"
  { regex: /(\d+\.?\d*)\s*slices?/i, type: 'slice' },
  // "1 piece", "2 pieces"
  { regex: /(\d+\.?\d*)\s*pieces?/i, type: 'piece' },
  // "1 katori"
  { regex: /(\d+\.?\d*)\s*(small|medium|large)?\s*katoris?/i, type: 'katori' },
  // "1 tablespoon", "2 tsp"
  { regex: /(\d+\.?\d*)\s*(tablespoons?|tbsp|teaspoons?|tsp)/i, type: 'spoon' },
];

function parseWordNumber(word) {
  if (!word) return 1;
  const lower = word.toLowerCase();
  if (lower === 'half') return 0.5;
  if (lower === 'quarter') return 0.25;
  const num = parseFloat(lower);
  return isNaN(num) ? 1 : num;
}

function parseQuantityFromDescription(text) {
  if (!text) return [];

  const hints = [];
  for (const pattern of PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      hints.push({
        quantity: parseWordNumber(match[1]),
        unit: pattern.type,
        size: match[2] || 'medium',
        raw: match[0],
      });
    }
  }
  return hints;
}

module.exports = { parseQuantityFromDescription };
