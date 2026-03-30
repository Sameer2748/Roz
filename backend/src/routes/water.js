const express = require('express');
const db = require('../config/db');
const authenticate = require('../middleware/auth');

const router = express.Router();

// POST /water
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { amount_ml, date } = req.body;
    if (!amount_ml || amount_ml === 0) {
      return res.status(400).json({ success: false, error: 'amount_ml must be non-zero', code: 'VALIDATION_ERROR' });
    }

    const result = await db.query(
      'INSERT INTO water_logs (user_id, amount_ml, logged_at) VALUES ($1, $2, COALESCE($3::TIMESTAMP, NOW())) RETURNING *',
      [req.user.id, amount_ml, date || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /water/today
router.get('/today', authenticate, async (req, res, next) => {
  try {
    const { date } = req.query;
    const result = await db.query(
      `SELECT COALESCE(SUM(amount_ml), 0) as total_ml, COUNT(*) as entries
       FROM water_logs
       WHERE user_id = $1 
       AND DATE(logged_at) = COALESCE($2::DATE, CURRENT_DATE)`,
      [req.user.id, date || null]
    );

    res.json({
      success: true,
      data: {
        total_ml: parseInt(result.rows[0].total_ml),
        entries: parseInt(result.rows[0].entries),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
