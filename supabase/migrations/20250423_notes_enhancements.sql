-- Add ratings and previews fields to notes table
ALTER TABLE notes 
ADD COLUMN file_type VARCHAR(10),
ADD COLUMN preview_url VARCHAR(255),
ADD COLUMN semester VARCHAR(50),
ADD COLUMN professor VARCHAR(100),
ADD COLUMN school VARCHAR(100);

-- Create note ratings table
CREATE TABLE note_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(note_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_note_ratings_note_id ON note_ratings(note_id);
CREATE INDEX idx_note_ratings_user_id ON note_ratings(user_id);

-- Create or replace view for notes with average ratings
CREATE OR REPLACE VIEW notes_with_ratings AS
SELECT 
  n.*,
  c.name as class_name,
  COALESCE(AVG(r.rating)::NUMERIC(2,1), 0) as avg_rating,
  COUNT(r.id) as rating_count
FROM 
  notes n
LEFT JOIN
  classes c ON n.class_id = c.id
LEFT JOIN 
  note_ratings r ON n.id = r.note_id
GROUP BY 
  n.id, c.name;

-- Create function to get note preview
CREATE OR REPLACE FUNCTION generate_note_preview() 
RETURNS TRIGGER AS $$
BEGIN
  -- Logic would be implemented in a separate service
  -- This is a placeholder that would be triggered to generate previews
  NEW.file_type = LOWER(SUBSTRING(NEW.file_path FROM '\.([^\.]+)$'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for preview generation
CREATE TRIGGER note_preview_trigger
BEFORE INSERT ON notes
FOR EACH ROW
EXECUTE FUNCTION generate_note_preview();

-- Function to search notes with typo tolerance
CREATE OR REPLACE FUNCTION search_notes(search_term TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  file_path TEXT,
  uploader_name TEXT,
  created_at TIMESTAMPTZ,
  class_name TEXT,
  avg_rating NUMERIC(2,1),
  rating_count BIGINT,
  file_type TEXT,
  professor TEXT,
  semester TEXT,
  school TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.description,
    n.file_path,
    n.uploader_name,
    n.created_at,
    c.name as class_name,
    COALESCE(AVG(r.rating)::NUMERIC(2,1), 0) as avg_rating,
    COUNT(r.id) as rating_count,
    n.file_type,
    n.professor,
    n.semester,
    n.school
  FROM 
    notes n
  LEFT JOIN
    classes c ON n.class_id = c.id
  LEFT JOIN 
    note_ratings r ON n.id = r.note_id
  WHERE 
    n.title ILIKE '%' || search_term || '%' OR
    n.description ILIKE '%' || search_term || '%' OR
    c.name ILIKE '%' || search_term || '%' OR
    n.professor ILIKE '%' || search_term || '%' OR
    n.semester ILIKE '%' || search_term || '%' OR
    n.school ILIKE '%' || search_term || '%' OR
    n.uploader_name ILIKE '%' || search_term || '%' OR
    SIMILARITY(n.title, search_term) > 0.3 OR
    SIMILARITY(c.name, search_term) > 0.3
  GROUP BY 
    n.id, c.name
  ORDER BY 
    GREATEST(
      SIMILARITY(n.title, search_term),
      SIMILARITY(c.name, search_term)
    ) DESC;
END;
$$ LANGUAGE plpgsql; 