-- Drop existing views first
DROP VIEW IF EXISTS user_reputation_with_badges;
DROP VIEW IF EXISTS comments_with_users;

-- Drop existing triggers first (before their dependent functions)
DROP TRIGGER IF EXISTS on_comment_like ON comment_likes;
DROP TRIGGER IF EXISTS on_rating_create ON note_ratings;
DROP TRIGGER IF EXISTS on_comment_create ON note_comments;
DROP TRIGGER IF EXISTS on_note_upload ON notes;

-- Drop existing functions
DROP FUNCTION IF EXISTS award_badges;
DROP FUNCTION IF EXISTS update_reputation_on_comment_like;
DROP FUNCTION IF EXISTS update_reputation_on_rating;
DROP FUNCTION IF EXISTS update_reputation_on_comment;
DROP FUNCTION IF EXISTS update_reputation_on_upload;

-- Drop existing tables
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS user_reputation;
DROP TABLE IF EXISTS comment_likes;
DROP TABLE IF EXISTS note_comments;

-- Create comment tables
CREATE TABLE note_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reply_to_id UUID REFERENCES note_comments(id) ON DELETE CASCADE,
  is_reply BOOLEAN DEFAULT FALSE
);

-- Create index for faster lookups
CREATE INDEX idx_note_comments_note_id ON note_comments(note_id);
CREATE INDEX idx_note_comments_user_id ON note_comments(user_id);
CREATE INDEX idx_note_comments_reply_to ON note_comments(reply_to_id);

-- Create comment likes table
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES note_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- Create user reputation table
CREATE TABLE user_reputation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  uploads_count INTEGER NOT NULL DEFAULT 0,
  ratings_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  received_likes_count INTEGER NOT NULL DEFAULT 0,
  high_rated_notes_count INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id)
);

-- Create user badges table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  badge_description TEXT NOT NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Create view to include usernames in comments
CREATE OR REPLACE VIEW comments_with_users AS
SELECT 
  c.*,
  u.email,
  profiles.avatar_url,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as user_name,
  (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count,
  (SELECT COUNT(*) FROM note_comments cr WHERE cr.reply_to_id = c.id) as replies_count
FROM 
  note_comments c
JOIN 
  auth.users u ON c.user_id = u.id
LEFT JOIN
  profiles ON c.user_id = profiles.id;

-- Function to update user reputation on upload
CREATE OR REPLACE FUNCTION update_reputation_on_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- If user already has a reputation record, update it
  IF EXISTS (SELECT 1 FROM user_reputation WHERE user_id = NEW.uploader_id) THEN
    UPDATE user_reputation 
    SET 
      total_points = total_points + 10,
      uploads_count = uploads_count + 1,
      level = GREATEST(1, FLOOR(POWER((total_points + 10) / 100, 0.5)) + 1)::INTEGER
    WHERE user_id = NEW.uploader_id;
  ELSE
    -- Otherwise create a new record
    INSERT INTO user_reputation (user_id, total_points, uploads_count, level)
    VALUES (NEW.uploader_id, 10, 1, 1);
  END IF;
  
  -- Check if user should get badges
  PERFORM award_badges(NEW.uploader_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user reputation on comment
CREATE OR REPLACE FUNCTION update_reputation_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- If user already has a reputation record, update it
  IF EXISTS (SELECT 1 FROM user_reputation WHERE user_id = NEW.user_id) THEN
    UPDATE user_reputation 
    SET 
      total_points = total_points + CASE WHEN NEW.is_reply THEN 3 ELSE 5 END,
      comments_count = comments_count + CASE WHEN NEW.is_reply THEN 0 ELSE 1 END,
      replies_count = replies_count + CASE WHEN NEW.is_reply THEN 1 ELSE 0 END,
      level = GREATEST(1, FLOOR(POWER((total_points + CASE WHEN NEW.is_reply THEN 3 ELSE 5 END) / 100, 0.5)) + 1)::INTEGER
    WHERE user_id = NEW.user_id;
  ELSE
    -- Otherwise create a new record
    INSERT INTO user_reputation (user_id, total_points, comments_count, replies_count, level)
    VALUES (NEW.user_id, CASE WHEN NEW.is_reply THEN 3 ELSE 5 END, 
            CASE WHEN NEW.is_reply THEN 0 ELSE 1 END,
            CASE WHEN NEW.is_reply THEN 1 ELSE 0 END, 1);
  END IF;
  
  -- Check if user should get badges
  PERFORM award_badges(NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user reputation on rating
CREATE OR REPLACE FUNCTION update_reputation_on_rating()
RETURNS TRIGGER AS $$
DECLARE
  note_owner_id UUID;
BEGIN
  -- Get the owner of the note
  SELECT uploader_id INTO note_owner_id FROM notes WHERE id = NEW.note_id;
  
  -- Update reputation for the rater
  IF EXISTS (SELECT 1 FROM user_reputation WHERE user_id = NEW.user_id) THEN
    UPDATE user_reputation 
    SET 
      total_points = total_points + 3,
      ratings_count = ratings_count + 1,
      level = GREATEST(1, FLOOR(POWER((total_points + 3) / 100, 0.5)) + 1)::INTEGER
    WHERE user_id = NEW.user_id;
  ELSE
    INSERT INTO user_reputation (user_id, total_points, ratings_count, level)
    VALUES (NEW.user_id, 3, 1, 1);
  END IF;
  
  -- If rating is 3 or higher, update the note owner's reputation
  IF NEW.rating >= 3 AND note_owner_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM user_reputation WHERE user_id = note_owner_id) THEN
      UPDATE user_reputation 
      SET 
        total_points = total_points + 5,
        high_rated_notes_count = high_rated_notes_count + 1,
        level = GREATEST(1, FLOOR(POWER((total_points + 5) / 100, 0.5)) + 1)::INTEGER
      WHERE user_id = note_owner_id;
    ELSE
      INSERT INTO user_reputation (user_id, total_points, high_rated_notes_count, level)
      VALUES (note_owner_id, 5, 1, 1);
    END IF;
    
    -- Check if note owner should get badges
    PERFORM award_badges(note_owner_id);
  END IF;
  
  -- Check if rater should get badges
  PERFORM award_badges(NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update reputation when a comment is liked
CREATE OR REPLACE FUNCTION update_reputation_on_comment_like()
RETURNS TRIGGER AS $$
DECLARE
  comment_user_id UUID;
BEGIN
  -- Get the user_id of the comment
  SELECT user_id INTO comment_user_id FROM note_comments WHERE id = NEW.comment_id;
  
  -- If comment author already has a reputation record, update it
  IF EXISTS (SELECT 1 FROM user_reputation WHERE user_id = comment_user_id) THEN
    UPDATE user_reputation 
    SET 
      total_points = total_points + 2,
      received_likes_count = received_likes_count + 1,
      level = GREATEST(1, FLOOR(POWER((total_points + 2) / 100, 0.5)) + 1)::INTEGER
    WHERE user_id = comment_user_id;
  ELSE
    -- Otherwise create a new record
    INSERT INTO user_reputation (user_id, total_points, received_likes_count, level)
    VALUES (comment_user_id, 2, 1, 1);
  END IF;
  
  -- Check if user should get badges
  PERFORM award_badges(comment_user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to award badges based on achievements
CREATE OR REPLACE FUNCTION award_badges(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
  rep RECORD;
BEGIN
  -- Get user reputation
  SELECT * INTO rep FROM user_reputation WHERE user_id = user_id_param;
  
  -- Award badges based on uploads
  IF rep.uploads_count >= 5 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id_param AND badge_type = 'uploads_bronze') THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (user_id_param, 'uploads_bronze', 'Resource Contributor', 'Upload 5 notes to help your peers');
  END IF;
  
  IF rep.uploads_count >= 20 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id_param AND badge_type = 'uploads_silver') THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (user_id_param, 'uploads_silver', 'Knowledge Sharer', 'Upload 20 notes to the community');
  END IF;
  
  IF rep.uploads_count >= 50 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id_param AND badge_type = 'uploads_gold') THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (user_id_param, 'uploads_gold', 'Study Materials Master', 'Upload 50 notes. You''re amazing!');
  END IF;
  
  -- Award badges based on comments
  IF rep.comments_count >= 10 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id_param AND badge_type = 'comments_bronze') THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (user_id_param, 'comments_bronze', 'Active Participant', 'Leave 10 comments on notes');
  END IF;
  
  IF rep.comments_count >= 50 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id_param AND badge_type = 'comments_silver') THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (user_id_param, 'comments_silver', 'Engaged Communicator', 'Leave 50 comments helping others');
  END IF;
  
  -- Award badges based on replies
  IF rep.replies_count >= 20 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id_param AND badge_type = 'replies_bronze') THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (user_id_param, 'replies_bronze', 'Helpful Responder', 'Reply to 20 comments');
  END IF;
  
  -- Award badges based on ratings
  IF rep.ratings_count >= 15 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id_param AND badge_type = 'ratings_bronze') THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (user_id_param, 'ratings_bronze', 'Quality Evaluator', 'Rate 15 different notes');
  END IF;
  
  -- Award badges based on likes received
  IF rep.received_likes_count >= 25 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id_param AND badge_type = 'likes_bronze') THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (user_id_param, 'likes_bronze', 'Appreciated Contributor', 'Receive 25 likes on your comments');
  END IF;
  
  -- Award badges based on high-rated notes
  IF rep.high_rated_notes_count >= 5 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id_param AND badge_type = 'quality_bronze') THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (user_id_param, 'quality_bronze', 'Quality Content Creator', 'Have 5 notes rated 3 stars or higher');
  END IF;
  
  -- Award level badges
  IF rep.level >= 5 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id_param AND badge_type = 'level_bronze') THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (user_id_param, 'level_bronze', 'Rising Star', 'Reach Level 5 in the community');
  END IF;
  
  IF rep.level >= 10 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id_param AND badge_type = 'level_silver') THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (user_id_param, 'level_silver', 'Study Champion', 'Reach Level 10. You''re making a big impact!');
  END IF;
  
  IF rep.level >= 20 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id_param AND badge_type = 'level_gold') THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description)
    VALUES (user_id_param, 'level_gold', 'Learning Legend', 'Reach Level 20. A true cornerstone of the community!');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER on_note_upload
AFTER INSERT ON notes
FOR EACH ROW
EXECUTE FUNCTION update_reputation_on_upload();

CREATE TRIGGER on_comment_create
AFTER INSERT ON note_comments
FOR EACH ROW
EXECUTE FUNCTION update_reputation_on_comment();

CREATE TRIGGER on_rating_create
AFTER INSERT ON note_ratings
FOR EACH ROW
EXECUTE FUNCTION update_reputation_on_rating();

CREATE TRIGGER on_comment_like
AFTER INSERT ON comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_reputation_on_comment_like();

-- Create reputation view with badge counts
CREATE OR REPLACE VIEW user_reputation_with_badges AS
SELECT 
  r.*,
  (SELECT COUNT(*) FROM user_badges WHERE user_id = r.user_id) as total_badges,
  (SELECT COUNT(*) FROM user_badges WHERE user_id = r.user_id AND badge_type LIKE '%gold') as gold_badges,
  (SELECT COUNT(*) FROM user_badges WHERE user_id = r.user_id AND badge_type LIKE '%silver') as silver_badges,
  (SELECT COUNT(*) FROM user_badges WHERE user_id = r.user_id AND badge_type LIKE '%bronze') as bronze_badges
FROM 
  user_reputation r; 