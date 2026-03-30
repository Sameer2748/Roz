const PATTERNS = [
  { regex: /(\d+\.?\d*)\s*(rotis?|chapatis?|parathas?|naans?|idlis?|dosas?|samosas?)/i, type: 'count' },
  { regex: /(\d+\.?\d*)\s*ml/i, type: 'ml' },
  { regex: /(\d+\.?\d*)\s*(g|grams?)/i, type: 'grams' },
  { regex: /(half|quarter|\d+\.?\d*)\s*(small|medium|large)?\s*bowls?/i, type: 'bowl' },
  { regex: /(half|quarter|\d+\.?\d*)\s*(small|medium|large)?\s*plates?/i, type: 'plate' },
  { regex: /(\d+\.?\d*)\s*cups?/i, type: 'cup' },
  { regex: /(\d+\.?\d*)\s*pieces?/i, type: 'piece' },
  { regex: /(\d+\.?\d*)\s*slices?/i, type: 'slice' },
];

function parseWord(w) {
  if (!w) return 1;
  if (w.toLowerCase() === 'half') return 0.5;
  if (w.toLowerCase() === 'quarter') return 0.25;
  const n = parseFloat(w);
  return isNaN(n) ? 1 : n;
}

export function parseQuantity(text) {
  if (!text) return [];
  const hints = [];
  for (const p of PATTERNS) {
    const m = text.match(p.regex);
    if (m) {
      hints.push({ quantity: parseWord(m[1]), unit: p.type, raw: m[0] });
    }
  }
  return hints;
}
