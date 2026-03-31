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

  const prompt = `You are a World-Class Clinical Nutritionist and Vision AI. Your goal is to analyze the provided food image and user description with extreme precision to estimate calories and macronutrients.

### PERSONALIZATION CONTEXT:
- **Location:** ${countryName} (${countryCode})
- **Dietary Preference:** ${dietaryPreference}
- **User's Input:** "${userDescription || 'No description provided'}"
${quantityHintText}

### STEP 1: VISUAL SCANNING PROTOCOL (Must perform all steps):
1. **Identify Primary Dish:** What is the main food item?
2. **Scan for Hidden Ingredients:** Look for oils, butter on breads, ghee on rotis, cream in sauces, dressing on salads, or sugar/syrup on desserts.
3. **Identify Side Dishes:** Are there pickles, chutneys, yogurt, or salad on the plate?
4. **Volume Heuristic:** Use the plate size/hand/spoon visible in the background to estimate grams.
   - Standard Dinner Plate: ~26cm diameter.
   - Standard Bowl: ~200-250ml.
   - Standard Spoon: ~5-15ml.

### STEP 2: COUNTRY-SPECIFIC COOKING LOGIC (${countryName}):
${countrySpecificContext}

### STEP 3: LOGGING RULES:
- **Quantity:** If the image is unclear, default to a standard "medium" serving (~150-200g). If the user provided a quantity in the description, prioritize it.
- **Calories:** Do NOT undershoot. If the food looks oily/greasy, add 1-2 tbsp (120-240 kcal) of "hidden fats" to the item's oil count.
- **Items:** Break down the analysis into individual components (e.g., "Paneer Tikka (6 pcs)", "Mint Chutney (2 tbsp)", "Lachha Paratha (1 pc)").

### STEP 4: OUTPUT FORMAT (Strict JSON Only):
Respond ONLY with raw JSON. No markdown, no "based on my analysis," no explanations.

{
  "food_name": "Concise name of the overall meal",
  "items_detected": [
    {
      "name": "Component name (e.g., Garlic Naan)",
      "quantity_description": "Precise description (e.g., 2 large pieces)",
      "quantity_grams": number,
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "fiber_g": number,
      "sugar_g": number,
      "sodium_mg": number,
      "cholesterol_mg": number,
      "cooking_notes": "Why this specific estimate? (e.g., looks like extra butter)"
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
  "confidence": number (0.0 to 1.0),
  "confidence_reason": "Explain briefly why (e.g., image is clear, portion well-defined)",
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
