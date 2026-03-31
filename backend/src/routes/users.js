const express = require('express');
const db = require('../config/db');
const authenticate = require('../middleware/auth');
const { calculateFullPlan } = require('../services/calorieCalculator');
const { getStreak } = require('../services/streakService');
const { validateGoal, validateActivityLevel, validateGender, validateDietaryPreference, validatePace } = require('../utils/validators');

const router = express.Router();

// GET /users/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    if (user && user.avatar_url && !user.avatar_url.startsWith('http')) {
      const { getImageUrl } = require('../config/s3');
      user.avatar_url = await getImageUrl(user.avatar_url);
    }

    const profileResult = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    const targetResult = await db.query(
      'SELECT * FROM daily_targets WHERE user_id = $1 ORDER BY effective_from DESC LIMIT 1',
      [userId]
    );
    const streak = await getStreak(userId);

    res.json({
      success: true,
      data: {
        user,
        profile: profileResult.rows[0] || null,
        daily_target: targetResult.rows[0] || null,
        streak,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /users/profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      age, gender, height_cm, weight_kg, target_weight_kg,
      activity_level, goal, pace, dietary_preference,
      allergies, meals_per_day, country_code, phone_number,
      name, avatar_url,
    } = req.body;

    // Validate fields if provided
    if (gender && !validateGender(gender)) {
      return res.status(400).json({ success: false, error: 'Invalid gender', code: 'VALIDATION_ERROR' });
    }
    if (goal && !validateGoal(goal)) {
      return res.status(400).json({ success: false, error: 'Invalid goal', code: 'VALIDATION_ERROR' });
    }
    if (activity_level && !validateActivityLevel(activity_level)) {
      return res.status(400).json({ success: false, error: 'Invalid activity level', code: 'VALIDATION_ERROR' });
    }
    if (pace && !validatePace(pace)) {
      return res.status(400).json({ success: false, error: 'Invalid pace', code: 'VALIDATION_ERROR' });
    }
    if (dietary_preference && !validateDietaryPreference(dietary_preference)) {
      return res.status(400).json({ success: false, error: 'Invalid dietary preference', code: 'VALIDATION_ERROR' });
    }

    // Update user fields if provided
    if (country_code || phone_number || name || avatar_url) {
      const uFields = [];
      const uValues = [];
      let uIdx = 1;
      
      if (country_code) {
        uFields.push(`country_code = $${uIdx++}`);
        uValues.push(country_code);
      }
      if (phone_number) {
        uFields.push(`phone_number = $${uIdx++}`);
        uValues.push(phone_number);
      }
      if (name) {
        uFields.push(`name = $${uIdx++}`);
        uValues.push(name);
      }
      if (avatar_url) {
        uFields.push(`avatar_url = $${uIdx++}`);
        uValues.push(avatar_url);
      }
      
      uValues.push(userId);
      await db.query(
        `UPDATE users SET ${uFields.join(', ')}, updated_at = NOW() WHERE id = $${uIdx}`,
        uValues
      );
    }

    // Build dynamic update query for profile
    const fields = [];
    const values = [];
    let idx = 1;

    const addField = (name, value) => {
      if (value !== undefined) {
        fields.push(`${name} = $${idx}`);
        values.push(value);
        idx++;
      }
    };

    addField('age', age);
    addField('gender', gender);
    addField('height_cm', height_cm);
    addField('weight_kg', weight_kg);
    addField('target_weight_kg', target_weight_kg);
    addField('activity_level', activity_level);
    addField('goal', goal);
    addField('pace', pace);
    addField('dietary_preference', dietary_preference);
    addField('allergies', allergies);
    addField('meals_per_day', meals_per_day);

    if (fields.length > 0) {
      fields.push(`updated_at = NOW()`);
      values.push(userId);
      await db.query(
        `UPDATE user_profiles SET ${fields.join(', ')} WHERE user_id = $${idx}`,
        values
      );
    }

    // Recalculate daily targets if key fields changed
    if (weight_kg || height_cm || age || gender || activity_level || goal || pace) {
      const profileResult = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
      const profile = profileResult.rows[0];

      if (profile.weight_kg && profile.height_cm && profile.age && profile.gender && profile.activity_level && profile.goal) {
        const plan = calculateFullPlan(profile);

        await db.query(
          `INSERT INTO daily_targets (user_id, calories, protein_g, carbs_g, fat_g, fiber_g, water_ml, effective_from)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)`,
          [userId, plan.calories, plan.protein_g, plan.carbs_g, plan.fat_g, plan.fiber_g, plan.water_ml]
        );
      }
    }

    const updatedProfile = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    const latestTarget = await db.query(
      'SELECT * FROM daily_targets WHERE user_id = $1 ORDER BY effective_from DESC LIMIT 1',
      [userId]
    );

    res.json({
      success: true,
      data: {
        profile: updatedProfile.rows[0],
        daily_target: latestTarget.rows[0] || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /users/calculate-plan (Public)
router.post('/calculate-plan', async (req, res, next) => {
  try {
    const { 
      age, gender, height_cm, weight_kg, 
      activity_level, goal, pace, dietary_preference 
    } = req.body;

    const plan = await generateAIPlan({
      gender, weight_kg, height_cm, age, activity_level, goal, pace, dietary_preference
    });

    res.json({
      success: true,
      data: { plan },
    });
  } catch (err) {
    next(err);
  }
});

const { generateAIPlan } = require('../services/aiPlanner');

// POST /users/onboarding
router.post('/onboarding', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      age, gender, height_cm, weight_kg, target_weight_kg,
      activity_level, goal, pace, dietary_preference,
      allergies, meals_per_day, country_code,
    } = req.body;

    console.log('DEBUG: Onboarding body received:', JSON.stringify(req.body, null, 2));

    // Update user country
    if (country_code) {
      await db.query('UPDATE users SET country_code = $1, updated_at = NOW() WHERE id = $2', [country_code, userId]);
    }

    // Update profile with all onboarding data
    await db.query(
      `UPDATE user_profiles SET
        age = $1, gender = $2, height_cm = $3, weight_kg = $4,
        target_weight_kg = $5, activity_level = $6, goal = $7, pace = $8,
        dietary_preference = $9, allergies = $10, meals_per_day = $11,
        onboarding_complete = true, updated_at = NOW()
       WHERE user_id = $12`,
      [age, gender, height_cm, weight_kg, target_weight_kg, activity_level, goal, pace,
       dietary_preference, allergies || [], meals_per_day || 3, userId]
    );

    // AI Plan Generation
    const plan = await generateAIPlan({
      gender, weight_kg, height_cm, age, activity_level, goal, pace, dietary_preference
    });

    // Store AI-generated plan
    await db.query(
      `INSERT INTO daily_targets (user_id, calories, protein_g, carbs_g, fat_g, fiber_g, water_ml)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, plan.calories, plan.protein_g, plan.carbs_g, plan.fat_g, plan.fiber_g || 25, plan.water_ml || 2500]
    );

    res.json({
      success: true,
      data: {
        plan,
        message: 'AI Personalized Nutrition Plan Generated Successfully!',
      },
    });
  } catch (err) {
    next(err);
  }
});

const multer = require('multer');
const { uploadImage, getImageUrl } = require('../config/s3');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// POST /users/avatar
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const imageKey = await uploadImage(req.file.buffer, req.file.mimetype);
    const imageUrl = await getImageUrl(imageKey);

    // Also update user record immediately
    await db.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [imageKey, req.user.id]);

    res.json({
      success: true,
      data: {
        avatar_url: imageUrl,
        storage_key: imageKey,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
