-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user_notes', 'user_notes', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for the user_notes bucket
DROP POLICY IF EXISTS "Public read access for user_notes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload user_notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own user_notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own user_notes" ON storage.objects;

-- Create new policies
-- 1. Allow public read access
CREATE POLICY "Public read access for user_notes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user_notes');

-- 2. Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload user_notes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user_notes' AND
  auth.role() = 'authenticated'
);

-- 3. Allow users to update their own files
CREATE POLICY "Users can update their own user_notes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user_notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'user_notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Allow users to delete their own files
CREATE POLICY "Users can delete their own user_notes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user_notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify the setup
SELECT * FROM storage.buckets WHERE id = 'user_notes';
SELECT relrowsecurity FROM pg_class WHERE oid = 'storage.objects'::regclass; 