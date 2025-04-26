-- Drop the view first
DROP VIEW IF EXISTS public.notes_with_classes;

-- Drop existing notes table if it exists
DROP TABLE IF EXISTS public.notes;

-- Create notes table with proper structure
CREATE TABLE public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    uploader_id UUID NOT NULL REFERENCES auth.users(id),
    uploader_name TEXT NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view notes"
    ON public.notes
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create notes"
    ON public.notes
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update their own notes"
    ON public.notes
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = uploader_id)
    WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Users can delete their own notes"
    ON public.notes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = uploader_id);

-- Create indexes for better performance
CREATE INDEX notes_uploader_id_idx ON public.notes(uploader_id);
CREATE INDEX notes_class_id_idx ON public.notes(class_id);
CREATE INDEX notes_created_at_idx ON public.notes(created_at DESC);

-- Recreate the view
CREATE VIEW public.notes_with_classes AS
SELECT 
    n.*,
    c.name as class_name,
    c.code as class_code
FROM public.notes n
JOIN public.classes c ON n.class_id = c.id; 