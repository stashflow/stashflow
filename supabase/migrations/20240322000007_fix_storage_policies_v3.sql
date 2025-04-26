-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for the notes bucket to start fresh
DROP POLICY IF EXISTS "Public read access for notes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own notes" ON storage.objects;

-- Simple policy for authenticated users to read, create, update, and delete objects in the notes bucket
CREATE POLICY "notes_full_access"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'notes')
WITH CHECK (bucket_id = 'notes');

-- Allow public read access to all objects in the notes bucket
CREATE POLICY "notes_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'notes'); 