const { groq } = require('../config/groq');

/**
 * AI Personalized Nutrition Planner using Groq
 */
async function generateAIPlan(profile) {
  const { gender, weight_kg, height_cm, age, activity_level, goal, pace, dietary_preference } = profile;

  const prompt = `
    You are an expert nutritionist. Create a personalized daily calorie and macronutrient plan for a user based on these details:
    - Gender: ${gender}
    - Age: ${age}
    - Height: ${height_cm} cm
    - Weight: ${weight_kg} kg
    - Activity Level: ${activity_level}
    - Goal: ${goal}
    - Pace: ${pace} lbs per week
    - Dietary Preference: ${dietary_preference}

    Response MUST be a valid JSON object only, with the following keys:
    - calories (integer)
    - protein_g (integer)
    - carbs_g (integer)
    - fat_g (integer)
    - fiber_g (integer)
    - water_ml (integer)
    - reasoning (short string explaining the plan)
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const plan = JSON.parse(completion.choices[0].message.content);
    return plan;
  } catch (error) {
    console.error('Groq AI Planner failed:', error.message);
    // Fallback to static formula if AI fails
    const { calculateFullPlan } = require('./calorieCalculator');
    return calculateFullPlan(profile);
  }
}

module.exports = { generateAIPlan };
