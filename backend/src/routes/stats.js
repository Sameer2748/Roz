const express = require('express');
const db = require('../config/db');
const authenticate = require('../middleware/auth');
const { getStreak } = require('../services/streakService');

const router = express.Router();

// GET /stats/daily/:date
router.get('/daily/:date', authenticate, async (req, res, next) => {
  try {
    const { date } = req.params;

    // Get food logs for the date
    const logsResult = await db.query(
      `SELECT
        SUM(calories) as calories,
        SUM(protein_g) as protein_g,
        SUM(carbs_g) as carbs_g,
        SUM(fat_g) as fat_g,
        SUM(fiber_g) as fiber_g,
        SUM(sugar_g) as sugar_g,
        SUM(sodium_mg) as sodium_mg,
        COUNT(*) as meal_count
       FROM food_logs
       WHERE user_id = $1 AND DATE(logged_at) = $2`,
      [req.user.id, date]
    );

    // Get water for the date
    const waterResult = await db.query(
      `SELECT COALESCE(SUM(amount_ml), 0) as total_ml
       FROM water_logs WHERE user_id = $1 AND DATE(logged_at) = $2`,
      [req.user.id, date]
    );

    // Get daily target
    const targetResult = await db.query(
      `SELECT * FROM daily_targets
       WHERE user_id = $1 AND effective_from <= $2
       ORDER BY effective_from DESC LIMIT 1`,
      [req.user.id, date]
    );

    const consumed = logsResult.rows[0];
    const target = targetResult.rows[0];

    res.json({
      success: true,
      data: {
        date,
        consumed: {
          calories: Math.round(parseFloat(consumed.calories || 0)),
          protein_g: Math.round(parseFloat(consumed.protein_g || 0) * 10) / 10,
          carbs_g: Math.round(parseFloat(consumed.carbs_g || 0) * 10) / 10,
          fat_g: Math.round(parseFloat(consumed.fat_g || 0) * 10) / 10,
          fiber_g: Math.round(parseFloat(consumed.fiber_g || 0) * 10) / 10,
          sugar_g: Math.round(parseFloat(consumed.sugar_g || 0) * 10) / 10,
          sodium_mg: Math.round(parseFloat(consumed.sodium_mg || 0)),
          meal_count: parseInt(consumed.meal_count || 0),
        },
        target: target || null,
        water_ml: parseInt(waterResult.rows[0].total_ml),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /stats/weekly
router.get('/weekly', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT DATE(logged_at) as date,
              SUM(calories) as calories,
              SUM(protein_g) as protein_g,
              SUM(carbs_g) as carbs_g,
              SUM(fat_g) as fat_g,
              COUNT(*) as meal_count
       FROM food_logs
       WHERE user_id = $1 AND DATE(logged_at) >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY DATE(logged_at)
       ORDER BY date ASC`,
      [req.user.id]
    );

    // Get target for comparison
    const targetResult = await db.query(
      'SELECT * FROM daily_targets WHERE user_id = $1 ORDER BY effective_from DESC LIMIT 1',
      [req.user.id]
    );

    // Calculate averages
    const days = result.rows;
    const avgCalories = days.length > 0
      ? Math.round(days.reduce((sum, d) => sum + parseFloat(d.calories || 0), 0) / days.length)
      : 0;

    res.json({
      success: true,
      data: {
        days: days.map(d => ({
          date: d.date,
          calories: Math.round(parseFloat(d.calories)),
          protein_g: Math.round(parseFloat(d.protein_g) * 10) / 10,
          carbs_g: Math.round(parseFloat(d.carbs_g) * 10) / 10,
          fat_g: Math.round(parseFloat(d.fat_g) * 10) / 10,
          meal_count: parseInt(d.meal_count),
        })),
        average_calories: avgCalories,
        target: targetResult.rows[0] || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /stats/streak
router.get('/streak', authenticate, async (req, res, next) => {
  try {
    const streak = await getStreak(req.user.id);
    res.json({ success: true, data: streak });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
