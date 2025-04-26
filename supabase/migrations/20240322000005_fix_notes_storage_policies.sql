-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for the notes bucket
DROP POLICY IF EXISTS "Public read access for notes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own notes" ON storage.objects;

-- Create new policies
-- 1. Allow public read access
CREATE POLICY "Public read access for notes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'notes');

-- 2. Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload notes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'notes' AND
  auth.role() = 'authenticated'
);

-- 3. Allow users to update their own files
CREATE POLICY "Users can update their own notes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Allow users to delete their own files
CREATE POLICY "Users can delete their own notes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify the setup
SELECT * FROM storage.buckets WHERE id = 'notes';
SELECT relrowsecurity FROM pg_class WHERE oid = 'storage.objects'::regclass; 