-- Create storage bucket for notes if it doesn't exist
insert into storage.buckets (id, name, public)
values ('notes', 'notes', true)
on conflict (id) do nothing;

-- Enable RLS on the storage bucket
alter table storage.objects enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Notes are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload notes" on storage.objects;
drop policy if exists "Users can update their own notes" on storage.objects;
drop policy if exists "Users can delete their own notes" on storage.objects;

-- Create policies for the notes bucket
create policy "Notes are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'notes');

create policy "Authenticated users can upload notes"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'notes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own notes"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'notes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own notes"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'notes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  ); 