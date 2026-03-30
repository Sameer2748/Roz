const db = require('../config/db');

async function updateStreak(userId) {
  const today = new Date().toISOString().split('T')[0];

  // Get current streak record
  let streak = await db.query('SELECT * FROM streaks WHERE user_id = $1', [userId]);

  if (streak.rows.length === 0) {
    // Create new streak record
    await db.query(
      'INSERT INTO streaks (user_id, current_streak, longest_streak, last_logged_date) VALUES ($1, 1, 1, $2)',
      [userId, today]
    );
    return { current_streak: 1, longest_streak: 1 };
  }

  const record = streak.rows[0];
  const lastLogged = record.last_logged_date ? new Date(record.last_logged_date).toISOString().split('T')[0] : null;

  if (lastLogged === today) {
    // Already logged today, no change
    return { current_streak: record.current_streak, longest_streak: record.longest_streak };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak;
  if (lastLogged === yesterdayStr) {
    // Consecutive day — increment streak
    newStreak = record.current_streak + 1;
  } else {
    // Streak broken — reset to 1
    newStreak = 1;
  }

  const newLongest = Math.max(newStreak, record.longest_streak);

  await db.query(
    'UPDATE streaks SET current_streak = $1, longest_streak = $2, last_logged_date = $3 WHERE user_id = $4',
    [newStreak, newLongest, today, userId]
  );

  return { current_streak: newStreak, longest_streak: newLongest };
}

async function getStreak(userId) {
  const result = await db.query('SELECT * FROM streaks WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    return { current_streak: 0, longest_streak: 0 };
  }

  const record = result.rows[0];
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const lastLogged = record.last_logged_date ? new Date(record.last_logged_date).toISOString().split('T')[0] : null;

  // If last logged date is not today or yesterday, streak is effectively 0
  if (lastLogged !== today && lastLogged !== yesterdayStr) {
    return { current_streak: 0, longest_streak: record.longest_streak };
  }

  return { current_streak: record.current_streak, longest_streak: record.longest_streak };
}

module.exports = { updateStreak, getStreak };
