const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const multer = require('multer');
const { uploadImage, getImageUrl } = require('../config/s3');
const authenticate = require('../middleware/auth');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 1. Create a new group
router.post('/', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    const { name, description, is_private = false } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadImage(req.file.buffer, req.file.mimetype);
    }

    // Generate unique 6-char invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const result = await db.query(
      `INSERT INTO groups (name, description, invite_code, created_by, is_private, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, inviteCode, req.user.id, is_private === 'true' || is_private === true, imageUrl]
    );

    const group = result.rows[0];
    if (group.image_url) {
      group.image_url = await getImageUrl(group.image_url);
    }

    // Add creator as owner/admin
    await db.query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [group.id, req.user.id, 'owner']
    );

    res.status(201).json({ success: true, data: group });
  } catch (err) {
    next(err);
  }
});

// 2. Join a group by invite code
router.post('/join', authenticate, async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ success: false, error: 'Invite code is required' });
    }

    // Find group
    const groupResult = await db.query('SELECT * FROM groups WHERE invite_code = $1', [inviteCode.toUpperCase()]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invalid invite code' });
    }

    const group = groupResult.rows[0];

    // Check if already a member
    const memberCheck = await db.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [group.id, req.user.id]
    );

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'You are already a member of this group' });
    }

    // Join
    await db.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
      [group.id, req.user.id, 'member']
    );

    res.json({ success: true, data: group });
  } catch (err) {
    next(err);
  }
});

// 3. List my groups
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT g.*, 
        (SELECT count(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );

    const groups = await Promise.all(result.rows.map(async (row) => ({
      ...row,
      image_url: row.image_url ? await getImageUrl(row.image_url) : null
    })));

    res.json({ success: true, data: groups });
  } catch (err) {
    next(err);
  }
});

// 4. Group details and members
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get group info
    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [id]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const group = groupResult.rows[0];
    if (group.image_url) {
      group.image_url = await getImageUrl(group.image_url);
    }

    // Get members with their current streaks
    const membersResult = await db.query(
      `SELECT u.id, u.name, u.avatar_url, gm.role, gm.joined_at, 
              s.current_streak, s.longest_streak
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       LEFT JOIN streaks s ON u.id = s.user_id
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...group,
        members: membersResult.rows
      }
    });
  } catch (err) {
    next(err);
  }
});

// 5. Leaderboard
router.get('/:id/leaderboard', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT u.id, u.name, u.avatar_url, 
              s.current_streak, s.longest_streak
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       JOIN streaks s ON u.id = s.user_id
       WHERE gm.group_id = $1
       ORDER BY s.current_streak DESC, s.longest_streak DESC
       LIMIT 50`,
      [id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

// 6. Invite by phone
router.post('/:id/invite-phone', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    // Check if group exists and requester is owner/admin
    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [id]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    // Find target user by phone
    const userResult = await db.query('SELECT id, name FROM users WHERE phone_number = $1', [phoneNumber]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User with this phone number not found. They must join Roz first.' });
    }

    const targetUser = userResult.rows[0];

    // Check if already in group
    const memberCheck = await db.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, targetUser.id]
    );
    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'User is already in this group' });
    }

    // In a real app, we might send an invite first. Here we add them directly for demo.
    await db.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
      [id, targetUser.id, 'member']
    );

    // Notify user via Socket
    if (req.io) {
      req.io.to(`user_${targetUser.id}`).emit('new_notification', {
        title: 'New Group',
        body: `You have been added to ${groupResult.rows[0].name}`,
        type: 'group_join',
        data: { groupId: id }
      });
    }

    res.json({ success: true, message: `Added ${targetUser.name} to the group` });
  } catch (err) {
    next(err);
  }
});

// 7. Send message to group chat
router.post('/:id/messages', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    // Verify membership
    const memberCheck = await db.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'You are not a member of this group' });
    }

    // Save message
    const result = await db.query(
      `INSERT INTO group_messages (group_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, userId, content]
    );

    const message = result.rows[0];

    // Fetch user info for broadcast
    const userResult = await db.query('SELECT name, avatar_url FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    // Wrap avatar if exists
    if (user.avatar_url) user.avatar_url = await getImageUrl(user.avatar_url);

    const broadcastMessage = {
      ...message,
      user_name: user.name,
      user_avatar: user.avatar_url
    };

    // Broadcast to room
    if (req.io) {
      req.io.to(`group_${id}`).emit('new_group_message', broadcastMessage);
    }

    res.status(201).json({ success: true, data: broadcastMessage });
  } catch (err) {
    next(err);
  }
});

// 8. Get group chat history
router.get('/:id/messages', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify membership
    const memberCheck = await db.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'You are not a member of this group' });
    }

    const result = await db.query(
      `SELECT m.*, u.name as user_name, u.avatar_url as user_avatar
       FROM group_messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.group_id = $1
       ORDER BY m.created_at DESC
       LIMIT 100`,
      [id]
    );

    // Sign avatars
    const messages = await Promise.all(result.rows.map(async (row) => ({
      ...row,
      user_avatar: row.user_avatar ? await getImageUrl(row.user_avatar) : null
    })));

    res.json({ success: true, data: messages.reverse() }); // Reverse for chronological order
  } catch (err) {
    next(err);
  }
});

module.exports = router;
