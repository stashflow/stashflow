-- Drop existing views first
drop view if exists public.notes_with_classes;
drop view if exists public.classes_with_favorites;

-- Drop existing class-related tables if they exist
drop table if exists public.class_favorites;
drop table if exists public.notes;
drop table if exists public.classes;

-- Create classes table with enhanced fields
create table public.classes (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    is_archived boolean default false not null,
    semester text,
    year integer,
    professor text
);

-- Create class favorites table
create table public.class_favorites (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    class_id uuid references public.classes(id) on delete cascade not null,
    created_at timestamptz default now() not null,
    unique(user_id, class_id)
);

-- Create notes table with class relationship
create table public.notes (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    class_id uuid references public.classes(id) on delete cascade not null,
    file_path text not null,
    uploader_id uuid references auth.users(id) on delete cascade not null,
    uploader_name text not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.classes enable row level security;
alter table public.class_favorites enable row level security;
alter table public.notes enable row level security;

-- Classes policies
create policy "Classes are viewable by everyone"
    on public.classes for select
    using (true);

create policy "Authenticated users can create classes"
    on public.classes for insert
    to authenticated
    with check (true);

create policy "Class creators can update their classes"
    on public.classes for update
    using (auth.uid() = created_by);

create policy "Class creators can delete their classes"
    on public.classes for delete
    using (auth.uid() = created_by);

-- Class favorites policies
create policy "Users can view their own favorites"
    on public.class_favorites for select
    using (auth.uid() = user_id);

create policy "Users can add favorites"
    on public.class_favorites for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can remove their favorites"
    on public.class_favorites for delete
    using (auth.uid() = user_id);

-- Notes policies
create policy "Notes are viewable by everyone"
    on public.notes for select
    using (true);

create policy "Authenticated users can create notes"
    on public.notes for insert
    to authenticated
    with check (auth.uid() = uploader_id);

create policy "Users can update their own notes"
    on public.notes for update
    using (auth.uid() = uploader_id);

create policy "Users can delete their own notes"
    on public.notes for delete
    using (auth.uid() = uploader_id);

-- Create indexes
create index classes_created_by_idx on public.classes(created_by);
create index class_favorites_user_id_idx on public.class_favorites(user_id);
create index class_favorites_class_id_idx on public.class_favorites(class_id);
create index notes_class_id_idx on public.notes(class_id);
create index notes_uploader_id_idx on public.notes(uploader_id);

-- Create view for classes with favorite status
create or replace view public.classes_with_favorites as
select 
    c.*,
    f.user_id is not null as is_favorited,
    count(distinct n.id) as note_count
from public.classes c
left join public.class_favorites f on c.id = f.class_id
left join public.notes n on c.id = n.class_id
where not c.is_archived
group by c.id, f.user_id;

-- Create view for notes with class information
create or replace view public.notes_with_classes as
select 
    n.*,
    c.name as class_name
from public.notes n
left join public.classes c on n.class_id = c.id;

-- Insert some initial classes
insert into public.classes (name, description, semester, year, professor)
values 
    ('Introduction to Computer Science', 'Basic concepts of computer science', 'Fall', 2024, 'Dr. Smith'),
    ('Data Structures and Algorithms', 'Advanced programming concepts', 'Spring', 2024, 'Dr. Johnson'),
    ('Web Development', 'Building modern web applications', 'Fall', 2024, 'Dr. Wilson'); 