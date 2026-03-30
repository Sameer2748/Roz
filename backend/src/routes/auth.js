const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const redis = require('../config/redis');

const router = express.Router();

// Verify Google ID token
async function verifyGoogleToken(idToken) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!response.ok) throw new Error('Invalid Google token');
  const payload = await response.json();
  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error('Token audience mismatch');
  return payload;
}

function generateTokens(userId) {
  const tokenId = uuidv4();
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, tokenId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken, tokenId };
}

// POST /auth/google
router.post('/google', async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, error: 'idToken is required', code: 'MISSING_TOKEN' });
    }

    const googleUser = await verifyGoogleToken(idToken);

    // Check if user exists
    let result = await db.query('SELECT * FROM users WHERE google_id = $1', [googleUser.sub]);
    let user;
    let isNewUser = false;

    if (result.rows.length === 0) {
      // Create new user
      const insertResult = await db.query(
        `INSERT INTO users (google_id, email, name, avatar_url)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [googleUser.sub, googleUser.email, googleUser.name, googleUser.picture]
      );
      user = insertResult.rows[0];
      isNewUser = true;

      // Create empty profile
      await db.query('INSERT INTO user_profiles (user_id) VALUES ($1)', [user.id]);
    } else {
      user = result.rows[0];
      // Update name and avatar if changed
      await db.query(
        'UPDATE users SET name = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3',
        [googleUser.name || user.name, googleUser.picture || user.avatar_url, user.id]
      );
    }

    // Check onboarding status
    const profileResult = await db.query('SELECT onboarding_complete FROM user_profiles WHERE user_id = $1', [user.id]);
    const onboardingComplete = profileResult.rows[0]?.onboarding_complete || false;

    const { accessToken, refreshToken, tokenId } = generateTokens(user.id);

    // Store refresh token in Redis (30 days)
    await redis.set(`refresh:${user.id}:${tokenId}`, 'valid', 'EX', 30 * 24 * 60 * 60);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          country_code: user.country_code,
        },
        isNewUser: isNewUser || !onboardingComplete,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'refreshToken required', code: 'MISSING_TOKEN' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const isValid = await redis.get(`refresh:${decoded.userId}:${decoded.tokenId}`);

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Refresh token revoked', code: 'TOKEN_REVOKED' });
    }

    // Invalidate old refresh token
    await redis.del(`refresh:${decoded.userId}:${decoded.tokenId}`);

    // Generate new tokens
    const tokens = generateTokens(decoded.userId);
    await redis.set(`refresh:${decoded.userId}:${tokens.tokenId}`, 'valid', 'EX', 30 * 24 * 60 * 60);

    res.json({
      success: true,
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Invalid refresh token', code: 'TOKEN_INVALID' });
    }
    next(err);
  }
});

// POST /auth/dev-login — DEV ONLY: create test user without Google OAuth
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-login', async (req, res, next) => {
    try {
      const { email, name } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'email required', code: 'MISSING_EMAIL' });
      }

      let result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      let user;
      let isNewUser = false;

      if (result.rows.length === 0) {
        const insertResult = await db.query(
          `INSERT INTO users (google_id, email, name) VALUES ($1, $2, $3) RETURNING *`,
          [`dev_${Date.now()}`, email, name || 'Test User']
        );
        user = insertResult.rows[0];
        isNewUser = true;
        await db.query('INSERT INTO user_profiles (user_id) VALUES ($1)', [user.id]);
      } else {
        user = result.rows[0];
      }

      const profileResult = await db.query('SELECT onboarding_complete FROM user_profiles WHERE user_id = $1', [user.id]);
      const onboardingComplete = profileResult.rows[0]?.onboarding_complete || false;

      const { accessToken, refreshToken, tokenId } = generateTokens(user.id);
      await redis.set(`refresh:${user.id}:${tokenId}`, 'valid', 'EX', 30 * 24 * 60 * 60);

      res.json({
        success: true,
        data: { accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name, country_code: user.country_code }, isNewUser: isNewUser || !onboardingComplete },
      });
    } catch (err) {
      next(err);
    }
  });
}

// POST /auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        await redis.del(`refresh:${decoded.userId}:${decoded.tokenId}`);
      } catch (_) {
        // Token already invalid, that's fine
      }
    }
    res.json({ success: true, data: { message: 'Logged out' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
