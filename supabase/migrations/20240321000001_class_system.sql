-- Create classes table
create table if not exists public.classes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notes table with class relationship
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  class_id uuid references public.classes(id) on delete cascade,
  file_path text not null,
  uploader_id uuid references auth.users(id) on delete cascade,
  uploader_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on classes
alter table public.classes enable row level security;

-- Create policies for classes
create policy "Classes are viewable by everyone"
  on public.classes for select
  using (true);

create policy "Authenticated users can create classes"
  on public.classes for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update their own classes"
  on public.classes for update
  using (auth.uid() = created_by);

-- Enable RLS on notes
alter table public.notes enable row level security;

-- Create policies for notes
create policy "Notes are viewable by everyone"
  on public.notes for select
  using (true);

create policy "Authenticated users can create notes"
  on public.notes for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = uploader_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = uploader_id);

-- Create indexes for better performance
create index notes_class_id_idx on public.notes(class_id);
create index notes_uploader_id_idx on public.notes(uploader_id);
create index classes_code_idx on public.classes(code); 