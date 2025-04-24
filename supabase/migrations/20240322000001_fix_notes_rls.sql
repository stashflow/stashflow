-- Drop existing policies
drop policy if exists "Notes are viewable by everyone" on public.notes;
drop policy if exists "Authenticated users can create notes" on public.notes;
drop policy if exists "Users can update their own notes" on public.notes;
drop policy if exists "Users can delete their own notes" on public.notes;

-- Enable RLS
alter table public.notes enable row level security;

-- Create policies
create policy "Notes are viewable by everyone"
  on public.notes for select
  using (true);

create policy "Authenticated users can create notes"
  on public.notes for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid() = uploader_id
  );

create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = uploader_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = uploader_id);

-- Ensure the notes table has the correct structure
alter table public.notes drop constraint if exists notes_class_id_fkey;
alter table public.notes drop constraint if exists notes_uploader_id_fkey;

alter table public.notes add constraint notes_class_id_fkey
  foreign key (class_id) references public.classes(id) on delete cascade;

alter table public.notes add constraint notes_uploader_id_fkey
  foreign key (uploader_id) references auth.users(id) on delete cascade; 