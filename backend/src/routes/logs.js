const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('../middleware/auth');
const db = require('../config/db');
const { analyzeFood, fixAnalysis } = require('../services/aiAnalyzer');
const { uploadImage, deleteImage, getImageUrl } = require('../config/s3');

// Helper to get user profile
async function getProfile(userId) {
  const res = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
  return res.rows[0];
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /logs/analyze — analyze food from image
router.post('/analyze', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Image is required' });
    }

    const { description, meal_type } = req.body;
    const imageBase64 = req.file.buffer.toString('base64');
    
    // Upload image to S3 (returns storage key)
    const imageKey = await uploadImage(req.file.buffer, req.file.mimetype);

    const userProfile = await getProfile(req.user.id);

    const result = await analyzeFood({
      imageBase64,
      mimeType: req.file.mimetype,
      userDescription: description,
      countryCode: req.user.country_code || 'IN',
      userProfile,
    });

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error, code: 'AI_ANALYSIS_FAILED' });
    }

    // Sign URL for the app
    const signedUrl = await getImageUrl(imageKey);

    res.json({
      success: true,
      data: {
        image_url: signedUrl,
        storage_key: imageKey, // Store key for persistence
        analysis: result.data,
        suggested_meal_type: meal_type || result.data.meal_type_suggestion,
        ai_calls_remaining: 30 - (req.aiCallCount || 0),
      },
    });
  } catch (err) {
    next(err);
  }
});
// POST /logs/fast-log — analyze and save immediately
router.post('/fast-log', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Image is required' });
    }

    const { description, meal_type } = req.body;
    const imageBase64 = req.file.buffer.toString('base64');
    
    // Upload image to S3 (returns storage key)
    const imageKey = await uploadImage(req.file.buffer, req.file.mimetype);

    const userProfile = await getProfile(req.user.id);

    const result = await analyzeFood({
      imageBase64,
      mimeType: req.file.mimetype,
      userDescription: description,
      countryCode: req.user.country_code || 'IN',
      userProfile,
    });

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    const analysis = result.data;

    // Save to DB immediately — pass logged_at from Node.js to avoid Docker clock drift
    const dbResult = await db.query(
      `INSERT INTO food_logs (
        user_id, food_name, description, quantity_description, quantity_grams,
        calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, cholesterol_mg,
        image_url, ai_confidence, ai_raw_response, meal_type, logged_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        req.user.id, analysis.food_name, description, 
        analysis.items_detected?.[0]?.quantity_description, analysis.items_detected?.[0]?.quantity_grams,
        analysis.total.calories, analysis.total.protein_g, analysis.total.carbs_g,
        analysis.total.fat_g, analysis.total.fiber_g, analysis.total.sugar_g,
        analysis.total.sodium_mg, analysis.total.cholesterol_mg,
        imageKey, analysis.confidence, analysis, meal_type || analysis.meal_type_suggestion,
        new Date().toISOString() // Use Node.js time to avoid Docker container clock drift
      ]
    );

    res.json({
      success: true,
      data: dbResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// POST /logs — save confirmed food log
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      image_url,
      storage_key,
      food_name,
      description,
      quantity_description,
      quantity_grams,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      fiber_g,
      sugar_g,
      sodium_mg,
      cholesterol_mg,
      meal_type,
      ai_confidence,
      ai_raw_response,
    } = req.body;

    // Favor storage key over signed URL
    const finalImageUrl = storage_key || image_url;

    const result = await db.query(
      `INSERT INTO food_logs (
        user_id, food_name, description, quantity_description, quantity_grams,
        calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, cholesterol_mg,
        image_url, ai_confidence, ai_raw_response, meal_type, logged_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        req.user.id, food_name, description, quantity_description, quantity_grams,
        calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, cholesterol_mg,
        finalImageUrl, ai_confidence, JSON.stringify(ai_raw_response), meal_type,
        new Date().toISOString() // Use Node.js time to avoid Docker clock drift
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/day', authenticate, async (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  try {
    const { date, tz = 'Asia/Kolkata' } = req.query; 
    
    // Most robust comparison: 
    // If no date provided, use the local "Today" for the given timezone
    const result = await db.query(
      `SELECT * FROM food_logs
       WHERE user_id = $1 
       AND (logged_at AT TIME ZONE $2)::date = COALESCE($3::date, (CURRENT_TIMESTAMP AT TIME ZONE $2)::date)
       ORDER BY logged_at ASC`,
      [req.user.id, tz, date || null]
    );

    const grouped = { breakfast: [], lunch: [], dinner: [], snack: [], pre_workout: [], post_workout: [] };
    let totals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0 };

    for (let log of result.rows) {
      if (log.image_url && !log.image_url.startsWith('http')) {
        log.image_url = await getImageUrl(log.image_url);
      } else if (log.image_url && log.image_url.includes('s3.amazonaws.com')) {
         log.image_url = await getImageUrl(log.image_url);
      }

      const type = log.meal_type || 'snack';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(log);
      
      totals.calories += parseFloat(log.calories || 0);
      totals.protein_g += parseFloat(log.protein_g || 0);
      totals.carbs_g += parseFloat(log.carbs_g || 0);
      totals.fat_g += parseFloat(log.fat_g || 0);
      totals.fiber_g += parseFloat(log.fiber_g || 0);
      totals.sugar_g += parseFloat(log.sugar_g || 0);
      totals.sodium_mg += parseFloat(log.sodium_mg || 0);
    }

    res.json({
      success: true,
      data: {
        meals: grouped,
        totals: {
          calories: Math.round(totals.calories),
          protein_g: Math.round(totals.protein_g * 10) / 10,
          carbs_g: Math.round(totals.carbs_g * 10) / 10,
          fat_g: Math.round(totals.fat_g * 10) / 10,
          fiber_g: Math.round(totals.fiber_g * 10) / 10,
          sugar_g: Math.round(totals.sugar_g * 10) / 10,
          sodium_mg: Math.round(totals.sodium_mg),
        },
        count: result.rows.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /logs/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM food_logs WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Log not found' });
    
    const log = result.rows[0];
    if (log.image_url && !log.image_url.startsWith('http')) {
      log.image_url = await getImageUrl(log.image_url);
    }
    
    res.json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
});

// PUT /logs/:id — direct update
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { 
      food_name, calories, protein_g, carbs_g, fat_g, 
      fiber_g, sugar_g, sodium_mg, serving_count, ai_raw_response 
    } = req.body;
    const logId = req.params.id;

    const result = await db.query(
      `UPDATE food_logs SET 
        food_name = COALESCE($1, food_name),
        calories = COALESCE($2, calories),
        protein_g = COALESCE($3, protein_g),
        carbs_g = COALESCE($4, carbs_g),
        fat_g = COALESCE($5, fat_g),
        fiber_g = COALESCE($6, fiber_g),
        sugar_g = COALESCE($7, sugar_g),
        sodium_mg = COALESCE($8, sodium_mg),
        serving_count = COALESCE($9, serving_count),
        ai_raw_response = COALESCE($10, ai_raw_response)
      WHERE id = $11 AND user_id = $12 RETURNING *`,
      [
        food_name, calories, protein_g, carbs_g, fat_g, 
        fiber_g, sugar_g, sodium_mg, serving_count,
        typeof ai_raw_response === 'object' ? JSON.stringify(ai_raw_response) : ai_raw_response,
        logId, req.user.id
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Log not found' });
    
    const updated = result.rows[0];
    if (updated.image_url && !updated.image_url.startsWith('http')) {
      updated.image_url = await getImageUrl(updated.image_url);
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /logs/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const check = await db.query('SELECT image_url FROM food_logs WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, error: 'Log not found' });

    const imageUrl = check.rows[0].image_url;
    if (imageUrl) {
      await deleteImage(imageUrl);
    }

    await db.query('DELETE FROM food_logs WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Log deleted' });
  } catch (err) {
    next(err);
  }
});

// PUT /logs/:id/fix
router.put('/:id/fix', authenticate, async (req, res, next) => {
  try {
    const { correction } = req.body;
    const logId = req.params.id;

    const logRes = await db.query('SELECT * FROM food_logs WHERE id = $1 AND user_id = $2', [logId, req.user.id]);
    if (logRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Log not found' });

    const log = logRes.rows[0];
    const userProfile = await getProfile(req.user.id);
    const fixed = await fixAnalysis({ 
      previousAnalysis: log.ai_raw_response, 
      fixDescription: correction,
      userProfile 
    });

    if (!fixed.success) return res.status(500).json({ success: false, error: 'Fix failed' });

    const updateRes = await db.query(
      `UPDATE food_logs SET 
        food_name = $1, calories = $2, protein_g = $3, carbs_g = $4, fat_g = $5,
        fiber_g = $6, sugar_g = $7, sodium_mg = $8, cholesterol_mg = $9,
        ai_raw_response = $10
      WHERE id = $11 RETURNING *`,
      [
        fixed.data.food_name, fixed.data.total.calories, fixed.data.total.protein_g, 
        fixed.data.total.carbs_g, fixed.data.total.fat_g, fixed.data.total.fiber_g,
        fixed.data.total.sugar_g, fixed.data.total.sodium_mg, fixed.data.total.cholesterol_mg,
        JSON.stringify(fixed.data), logId
      ]
    );

    const updatedLog = updateRes.rows[0];
    if (updatedLog.image_url && !updatedLog.image_url.startsWith('http')) {
      updatedLog.image_url = await getImageUrl(updatedLog.image_url);
    }

    res.json({ success: true, data: updatedLog });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
