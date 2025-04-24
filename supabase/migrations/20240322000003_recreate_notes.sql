-- Drop existing table and its policies
drop table if exists public.notes cascade;

-- Create notes table
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  class_id uuid not null references public.classes(id) on delete cascade,
  file_path text not null,
  uploader_id uuid not null references auth.users(id) on delete cascade,
  uploader_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index notes_class_id_idx on public.notes(class_id);
create index notes_uploader_id_idx on public.notes(uploader_id);

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