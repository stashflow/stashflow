-- Create notes table
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  class text not null,
  file_path text not null,
  uploader_id uuid not null references auth.users(id),
  uploader_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notes enable row level security;

-- Create policies
create policy "Public notes are viewable by everyone"
  on public.notes for select
  using (true);

create policy "Users can insert their own notes"
  on public.notes for insert
  with check (auth.uid() = uploader_id);

create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = uploader_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = uploader_id);

-- Create storage bucket for notes
insert into storage.buckets (id, name, public) values ('notes', 'notes', true);

-- Enable RLS on storage
create policy "Anyone can view notes"
  on storage.objects for select
  using ( bucket_id = 'notes' );

create policy "Authenticated users can upload notes"
  on storage.objects for insert
  with check ( bucket_id = 'notes' AND auth.role() = 'authenticated' );

create policy "Users can update their own notes"
  on storage.objects for update
  using ( bucket_id = 'notes' AND owner = auth.uid() );

create policy "Users can delete their own notes"
  on storage.objects for delete
  using ( bucket_id = 'notes' AND owner = auth.uid() ); 