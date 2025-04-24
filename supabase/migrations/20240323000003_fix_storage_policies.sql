-- Drop existing policies
drop policy if exists "Notes are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload notes" on storage.objects;
drop policy if exists "Users can update their own notes" on storage.objects;
drop policy if exists "Users can delete their own notes" on storage.objects;

-- Create storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('notes', 'notes', true)
on conflict (id) do nothing;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Create policies with proper checks
create policy "Notes are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'notes');

create policy "Authenticated users can upload notes"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'notes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
    and array_position(array['pdf', 'doc', 'docx', 'txt', 'md'], lower(storage.extension(name))) > 0
  );

create policy "Users can update their own notes"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'notes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own notes"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'notes'
    and (storage.foldername(name))[1] = auth.uid()::text
  ); 