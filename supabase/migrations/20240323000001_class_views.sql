-- Drop existing view if it exists
DROP VIEW IF EXISTS classes_with_favorites;

-- Create view for classes with favorites and note counts
CREATE VIEW classes_with_favorites AS
SELECT 
  c.*,
  COALESCE(nc.note_count, 0) as note_count,
  CASE 
    WHEN f.user_id IS NOT NULL THEN true
    ELSE false
  END as is_favorited,
  f.user_id as favorited_by
FROM classes c
LEFT JOIN (
  SELECT class_id, COUNT(*) as note_count 
  FROM notes 
  GROUP BY class_id
) nc ON c.id = nc.class_id
LEFT JOIN class_favorites f ON c.id = f.class_id
WHERE NOT c.is_archived OR c.is_archived IS NULL; 