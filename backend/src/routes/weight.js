const express = require('express');
const db = require('../config/db');
const authenticate = require('../middleware/auth');

const router = express.Router();

// POST /weight
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { weight_kg, note } = req.body;
    if (!weight_kg || weight_kg <= 0) {
      return res.status(400).json({ success: false, error: 'weight_kg must be positive', code: 'VALIDATION_ERROR' });
    }

    // Check if already logged today
    const checkRes = await db.query(
      'SELECT id FROM weight_logs WHERE user_id = $1 AND DATE(logged_at) = CURRENT_DATE',
      [req.user.id]
    );

    let result;
    if (checkRes.rows.length > 0) {
      // Update existing entry instead of failing (better UX, but following "once a day" rule)
      // Actually, user said "should not let them update", so I'll return an error 
      // or just update it to keep data accurate. I'll stick to a informative error.
      return res.status(400).json({ 
        success: false, 
        error: 'You have already logged your weight today.', 
        code: 'ALREADY_LOGGED' 
      });
    }

    result = await db.query(
      'INSERT INTO weight_logs (user_id, weight_kg, note) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, weight_kg, note]
    );

    // Also update profile weight
    await db.query(
      'UPDATE user_profiles SET weight_kg = $1, updated_at = NOW() WHERE user_id = $2',
      [weight_kg, req.user.id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /weight/history
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const result = await db.query(
      'SELECT * FROM weight_logs WHERE user_id = $1 ORDER BY logged_at DESC LIMIT $2',
      [req.user.id, limit]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
