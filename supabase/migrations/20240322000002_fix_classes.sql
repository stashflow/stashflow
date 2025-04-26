-- Drop existing policies
drop policy if exists "Classes are viewable by everyone" on public.classes;
drop policy if exists "Authenticated users can create classes" on public.classes;

-- Create classes table if it doesn't exist
create table if not exists public.classes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.classes enable row level security;

-- Create policies
create policy "Classes are viewable by everyone"
  on public.classes for select
  using (true);

create policy "Authenticated users can create classes"
  on public.classes for insert
  with check (auth.role() = 'authenticated');

-- Insert some test classes if they don't exist
insert into public.classes (name, code, description)
values 
  ('Introduction to Computer Science', 'CS101', 'Basic concepts of computer science'),
  ('Data Structures and Algorithms', 'CS201', 'Advanced programming concepts'),
  ('Web Development', 'CS301', 'Building modern web applications')
on conflict (code) do nothing; 