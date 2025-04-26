-- Drop existing functions and triggers if they exist
DROP POLICY IF EXISTS admin_classes_policy ON classes;
DROP POLICY IF EXISTS admin_notes_policy ON notes;
DROP FUNCTION IF EXISTS check_admin_permission() CASCADE;
DROP FUNCTION IF EXISTS delete_class(integer);
DROP FUNCTION IF EXISTS delete_note(integer);
DROP TRIGGER IF EXISTS prevent_class_deletion ON classes;
DROP TRIGGER IF EXISTS prevent_note_deletion ON notes;
DROP TRIGGER IF EXISTS log_class_admin_actions ON classes;
DROP TRIGGER IF EXISTS log_note_admin_actions ON notes;

-- Add is_admin column to auth.users table
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION check_admin_permission()
RETURNS boolean AS $$
DECLARE
    current_user_id uuid;
    is_admin boolean;
BEGIN
    -- Get the current user's ID
    current_user_id := auth.uid();
    
    -- If no user is logged in, return false
    IF current_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if the user is an admin
    SELECT is_admin INTO is_admin
    FROM auth.users
    WHERE id = current_user_id;
    
    -- Return the admin status (false if NULL)
    RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete class (admin only)
CREATE OR REPLACE FUNCTION delete_class(class_id integer)
RETURNS void AS $$
BEGIN
    -- Check if user is admin
    IF NOT check_admin_permission() THEN
        RAISE EXCEPTION 'Only administrators can delete classes';
    END IF;

    -- Delete all notes in the class first
    DELETE FROM notes WHERE class_id = class_id;
    
    -- Delete the class
    DELETE FROM classes WHERE id = class_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete note (admin only)
CREATE OR REPLACE FUNCTION delete_note(note_id integer)
RETURNS void AS $$
BEGIN
    -- Check if user is admin
    IF NOT check_admin_permission() THEN
        RAISE EXCEPTION 'Only administrators can delete notes';
    END IF;

    -- Get file path for deletion from storage
    DECLARE
        file_path text;
    BEGIN
        SELECT file_path INTO file_path FROM notes WHERE id = note_id;
        
        -- Delete from storage
        PERFORM supabase.storage.delete_object('notes', file_path);
        
        -- Delete from database
        DELETE FROM notes WHERE id = note_id;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to prevent direct deletion
CREATE OR REPLACE FUNCTION prevent_direct_deletion()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Direct deletion not allowed. Use the delete_class() or delete_note() functions instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_class_deletion
    BEFORE DELETE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION prevent_direct_deletion();

CREATE TRIGGER prevent_note_deletion
    BEFORE DELETE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION prevent_direct_deletion();

-- Create RLS policies for admin access
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all classes
CREATE POLICY admin_classes_policy ON classes
    FOR ALL
    TO authenticated
    USING (check_admin_permission());

-- Create policy for admins to view all notes
CREATE POLICY admin_notes_policy ON notes
    FOR ALL
    TO authenticated
    USING (check_admin_permission());

-- Create function to set user as admin
CREATE OR REPLACE FUNCTION set_user_admin(user_id uuid, is_admin boolean)
RETURNS void AS $$
BEGIN
    -- Only existing admins can set other users as admin
    IF NOT check_admin_permission() THEN
        RAISE EXCEPTION 'Only administrators can modify admin status';
    END IF;

    UPDATE auth.users
    SET is_admin = is_admin
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all users with admin status
CREATE OR REPLACE FUNCTION get_users_with_admin_status()
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    is_admin boolean,
    created_at timestamptz
) AS $$
BEGIN
    -- Only admins can view this information
    IF NOT check_admin_permission() THEN
        RAISE EXCEPTION 'Only administrators can view user information';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.raw_user_meta_data->>'full_name' as full_name,
        u.is_admin,
        u.created_at
    FROM auth.users u
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get admin activity log
CREATE OR REPLACE FUNCTION get_admin_activity_log()
RETURNS TABLE (
    id bigint,
    admin_id uuid,
    admin_email text,
    action text,
    target_type text,
    target_id integer,
    performed_at timestamptz
) AS $$
BEGIN
    -- Only admins can view the activity log
    IF NOT check_admin_permission() THEN
        RAISE EXCEPTION 'Only administrators can view the activity log';
    END IF;

    RETURN QUERY
    SELECT 
        al.id,
        al.admin_id,
        u.email as admin_email,
        al.action,
        al.target_type,
        al.target_id,
        al.performed_at
    FROM admin_activity_log al
    JOIN auth.users u ON al.admin_id = u.id
    ORDER BY al.performed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id bigserial PRIMARY KEY,
    admin_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    target_type text NOT NULL,
    target_id integer,
    performed_at timestamptz DEFAULT now(),
    details jsonb
);

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    action text,
    target_type text,
    target_id integer,
    details jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    -- Only admins can log actions
    IF NOT check_admin_permission() THEN
        RAISE EXCEPTION 'Only administrators can log actions';
    END IF;

    INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details)
    VALUES (auth.uid(), action, target_type, target_id, details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log admin actions
CREATE OR REPLACE FUNCTION log_admin_actions_trigger()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM log_admin_action(
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            jsonb_build_object(
                'old_data', to_jsonb(OLD)
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_admin_action(
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            jsonb_build_object(
                'old_data', to_jsonb(OLD),
                'new_data', to_jsonb(NEW)
            )
        );
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM log_admin_action(
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            jsonb_build_object(
                'new_data', to_jsonb(NEW)
            )
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for admin activity logging
CREATE TRIGGER log_class_admin_actions
    AFTER INSERT OR UPDATE OR DELETE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION log_admin_actions_trigger();

CREATE TRIGGER log_note_admin_actions
    AFTER INSERT OR UPDATE OR DELETE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION log_admin_actions_trigger();

-- Create function to verify admin status
CREATE OR REPLACE FUNCTION verify_admin_status(user_email text)
RETURNS boolean AS $$
DECLARE
    admin_status boolean;
BEGIN
    SELECT u.is_admin INTO admin_status
    FROM auth.users u
    WHERE u.email = user_email;
    
    RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 