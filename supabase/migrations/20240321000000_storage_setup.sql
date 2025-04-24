-- Create storage bucket for notes
insert into storage.buckets (id, name, public) values ('notes', 'notes', true);

-- Enable RLS on storage
create policy "Anyone can view notes"
  on storage.objects for select
  using ( bucket_id = 'notes' );

create policy "Authenticated users can upload notes"
  on storage.objects for insert
  with check ( 
    bucket_id = 'notes' 
    AND auth.role() = 'authenticated'
    AND split_part(name, '/', 1) = 'public'
    AND lower(split_part(name, '.', 2)) IN ('pdf', 'doc', 'docx', 'txt', 'md')
    AND split_part(name, '.', 2) != ''
  );

create policy "Users can update their own notes"
  on storage.objects for update
  using ( bucket_id = 'notes' AND owner = auth.uid() );

create policy "Users can delete their own notes"
  on storage.objects for delete
  using ( bucket_id = 'notes' AND owner = auth.uid() );

-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id); 