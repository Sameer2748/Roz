-- Migration: 003_groups_v2.sql

-- 1. Add phone_number to users for searching/inviting
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(15) UNIQUE;

-- 2. Add invite_only flag to groups
ALTER TABLE groups ADD COLUMN IF NOT EXISTS invite_only BOOLEAN DEFAULT false;

-- 3. Groups table might already have image_url, let's ensure it's there
-- (Checking existing schema in 002_add_groups.sql, it had image_url)
-- No changes needed for column, it's already there.

-- 4. Notification table for real-time invites
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'group_invite', 'meal_liked' etc.
  title VARCHAR(255) NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
