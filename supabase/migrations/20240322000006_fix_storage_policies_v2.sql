-- Drop any existing triggers
DROP TRIGGER IF EXISTS log_note_changes ON "public"."notes";
DROP TRIGGER IF EXISTS log_admin_actions ON "public"."notes";

-- Drop any existing functions
DROP FUNCTION IF EXISTS public.log_admin_action;
DROP FUNCTION IF EXISTS public.create_note;

-- Disable RLS on storage.objects and notes
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notes" DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies since we're disabling RLS
DROP POLICY IF EXISTS "Public read access for notes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own notes" ON storage.objects;
DROP POLICY IF EXISTS "notes_insert_policy" ON "public"."notes";
DROP POLICY IF EXISTS "notes_select_policy" ON "public"."notes";
DROP POLICY IF EXISTS "notes_update_policy" ON "public"."notes";
DROP POLICY IF EXISTS "notes_delete_policy" ON "public"."notes";

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT SELECT ON "public"."notes" TO anon;

-- Grant storage permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Reset ownership
ALTER TABLE "public"."notes" OWNER TO postgres; 