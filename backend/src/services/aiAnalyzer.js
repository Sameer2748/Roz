const { groq, VISION_MODEL } = require('../config/groq');
const { getCountryContext, getCountryName } = require('../utils/countryContext');
const { parseQuantityFromDescription } = require('../utils/parseQuantity');

async function analyzeFood({ imageBase64, mimeType, userDescription, countryCode, userProfile }) {
  const countryName = getCountryName(countryCode);
  const countrySpecificContext = getCountryContext(countryCode);
  const dietaryPreference = userProfile?.dietary_preference || 'not specified';

  const quantityHints = userDescription ? parseQuantityFromDescription(userDescription) : [];
  const quantityHintText = quantityHints.length > 0
    ? `\nQuantity hints extracted from user description: ${JSON.stringify(quantityHints)}`
    : '';

  const prompt = `You are a precise nutritionist AI specializing in ${countryName} cuisine. Analyze this food image and estimate exact calorie and macronutrient content.

User context:
- Country: ${countryName} (${countryCode})
- Dietary preference: ${dietaryPreference}
- Description from user: "${userDescription || 'none provided'}"
${quantityHintText}

COUNTRY-SPECIFIC COOKING ASSUMPTIONS FOR ${countryName}:
${countrySpecificContext}

QUANTITY ESTIMATION RULES:
- Roti/Chapati: count visible pieces. Medium roti = ~80 kcal. With ghee = ~110 kcal.
- Bowl of vegetable curry: small (150ml) = ~80 kcal, medium (200ml) = ~120 kcal, large (300ml) = ~180 kcal.
- Dal: 200ml bowl = ~150 kcal. Add 30 kcal for ghee tadka.
- Rice: 1 medium bowl cooked (~150g) = ~195 kcal.
- Curd/Dahi: per 100ml full-fat = ~60 kcal.
- If user specifies quantity in description, always use that as primary quantity signal.

IMPORTANT: Respond ONLY with valid JSON, no markdown, no explanation, no code blocks. Just raw JSON:
{
  "food_name": "string",
  "items_detected": [
    {
      "name": "string",
      "quantity_description": "string",
      "quantity_grams": number,
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "fiber_g": number,
      "sugar_g": number,
      "sodium_mg": number,
      "cholesterol_mg": number,
      "cooking_notes": "string"
    }
  ],
  "total": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "fiber_g": number,
    "sugar_g": number,
    "sodium_mg": number,
    "cholesterol_mg": number
  },
  "confidence": number,
  "confidence_reason": "string",
  "meal_type_suggestion": "breakfast|lunch|dinner|snack"
}`;

  const imageUrl = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;

  try {
    const completion = await groq.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2048,
    });

    let text = completion.choices[0]?.message?.content || '';

    // Strip markdown code blocks if model wraps the JSON
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract JSON if there's surrounding text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    const parsed = JSON.parse(text);
    const validated = validateResponse(parsed);
    return { success: true, data: validated };
  } catch (firstError) {
    console.error('Groq vision attempt failed:', firstError.message);

    // Retry with simpler prompt
    try {
      const simplePrompt = `Look at this food image. Return ONLY raw JSON (no markdown): {"food_name":"string","total":{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number},"confidence":0.5,"confidence_reason":"string","meal_type_suggestion":"snack","items_detected":[]}`;

      const retryCompletion = await groq.chat.completions.create({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: simplePrompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 512,
      });

      let retryText = retryCompletion.choices[0]?.message?.content || '';
      retryText = retryText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = retryText.match(/\{[\s\S]*\}/);
      if (jsonMatch) retryText = jsonMatch[0];

      const retryParsed = JSON.parse(retryText);
      const fallbackData = buildFallback(retryParsed);
      return { success: true, data: fallbackData };
    } catch (retryError) {
      console.error('Retry also failed:', retryError.message);
      return { success: false, error: 'Failed to analyze food image. Please try again.' };
    }
  }
}

function buildFallback(parsed) {
  const total = parsed.total || {};
  return {
    food_name: parsed.food_name || 'Unknown Food',
    items_detected: [{
      name: parsed.food_name || 'Unknown Food',
      quantity_description: '1 serving',
      quantity_grams: 200,
      calories: total.calories || parsed.calories || 0,
      protein_g: total.protein_g || 0,
      carbs_g: total.carbs_g || 0,
      fat_g: total.fat_g || 0,
      fiber_g: 0, sugar_g: 0, sodium_mg: 0, cholesterol_mg: 0,
      cooking_notes: 'Simplified analysis — please review',
    }],
    total: {
      calories: total.calories || 0,
      protein_g: total.protein_g || 0,
      carbs_g: total.carbs_g || 0,
      fat_g: total.fat_g || 0,
      fiber_g: 0, sugar_g: 0, sodium_mg: 0, cholesterol_mg: 0,
    },
    confidence: parsed.confidence || 0.4,
    confidence_reason: 'Simplified retry analysis',
    meal_type_suggestion: parsed.meal_type_suggestion || 'snack',
  };
}

function validateResponse(data) {
  if (!data.food_name) data.food_name = 'Unknown Food';
  if (!data.items_detected) data.items_detected = [];
  if (!data.total) {
    data.total = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0, cholesterol_mg: 0 };
  }

  data.total.calories = Math.max(0, Math.min(data.total.calories || 0, 10000));
  data.total.protein_g = Math.max(0, data.total.protein_g || 0);
  data.total.carbs_g = Math.max(0, data.total.carbs_g || 0);
  data.total.fat_g = Math.max(0, data.total.fat_g || 0);

  data.items_detected = data.items_detected.map(item => ({
    name: item.name || 'Unknown Item',
    quantity_description: item.quantity_description || '1 serving',
    quantity_grams: Math.max(0, Math.min(item.quantity_grams || 0, 5000)),
    calories: Math.max(0, Math.min(item.calories || 0, 5000)),
    protein_g: Math.max(0, item.protein_g || 0),
    carbs_g: Math.max(0, item.carbs_g || 0),
    fat_g: Math.max(0, item.fat_g || 0),
    fiber_g: Math.max(0, item.fiber_g || 0),
    sugar_g: Math.max(0, item.sugar_g || 0),
    sodium_mg: Math.max(0, item.sodium_mg || 0),
    cholesterol_mg: Math.max(0, item.cholesterol_mg || 0),
    cooking_notes: item.cooking_notes || '',
  }));

  if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) data.confidence = 0.5;
  if (!data.confidence_reason) data.confidence_reason = '';
  if (!data.meal_type_suggestion) data.meal_type_suggestion = 'snack';

  return data;
}

async function fixAnalysis({ previousAnalysis, fixDescription, userProfile }) {
  const dietaryPreference = userProfile?.dietary_preference || 'not specified';

  const prompt = `You are a precise nutritionist AI. A user wants to correct a previous food analysis.
  
  PREVIOUS ANALYSIS:
  ${JSON.stringify(previousAnalysis, null, 2)}
  
  USER CORRECTION:
  "${fixDescription}"
  
  User dietary preference: ${dietaryPreference}
  
  Based on the user's correction, update the items, quantities, and totals. 
  Example: if the user says "actually there were 3 rotis", update the roti count and recalculate all macros.
  
  Respond ONLY with the updated full raw JSON (no markdown):
  {
    "food_name": "updated name",
    "items_detected": [...],
    "total": { ... },
    "confidence": 0.9,
    "confidence_reason": "string",
    "meal_type_suggestion": "string"
  }`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    let text = completion.choices[0]?.message?.content || '';
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    const parsed = JSON.parse(text);
    return { success: true, data: validateResponse(parsed) };
  } catch (err) {
    console.error('Fix analysis failed:', err.message);
    return { success: false, error: 'Failed to refine analysis' };
  }
}

module.exports = { analyzeFood, fixAnalysis };
