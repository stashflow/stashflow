-- Temporarily disable RLS on storage.objects to allow all operations
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verify that RLS is disabled
SELECT relrowsecurity FROM pg_class WHERE oid = 'storage.objects'::regclass; 