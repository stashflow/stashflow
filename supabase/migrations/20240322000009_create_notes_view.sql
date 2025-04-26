-- Drop the view if it exists
DROP VIEW IF EXISTS notes_with_classes;

-- Create a view that joins notes with classes
CREATE VIEW notes_with_classes AS
SELECT
  n.id,
  n.title,
  n.description,
  n.file_path,
  n.uploader_id,
  n.uploader_name,
  n.created_at,
  n.updated_at,
  n.class_id,
  c.name AS class_name
FROM
  notes n
LEFT JOIN
  classes c ON n.class_id = c.id;

-- Grant access to the view
GRANT SELECT ON notes_with_classes TO authenticated, anon; 