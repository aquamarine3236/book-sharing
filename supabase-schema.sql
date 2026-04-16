-- ============================================================
-- Bookaholic Dimension — Supabase Database Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ── 1. USERS ─────────────────────────────────────────────────
-- Mirrors auth.users for display_name / provider storage
create table if not exists public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text        not null default '',
  email        text        not null default '',
  provider     text        not null default 'email',
  created_at   timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can upsert own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);


-- ── 2. BOOKS ─────────────────────────────────────────────────
create table if not exists public.books (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  genre        text        not null,
  description  text        not null default '',
  file_url     text        not null default '',
  file_name    text        not null default '',
  user_id      uuid        not null references auth.users(id) on delete cascade,
  display_name text        not null default '',
  avg_rating   numeric(3,1) not null default 0,
  review_count integer      not null default 0,
  created_at   timestamptz  not null default now()
);

alter table public.books enable row level security;

create policy "Authenticated users can read books"
  on public.books for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can create books"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "Owners can update own books"
  on public.books for update
  using (auth.uid() = user_id);

create policy "Owners can delete own books"
  on public.books for delete
  using (auth.uid() = user_id);

-- Index for genre filtering + date sorting
create index if not exists books_genre_idx      on public.books(genre);
create index if not exists books_created_at_idx on public.books(created_at desc);


-- ── 3. REVIEWS ───────────────────────────────────────────────
create table if not exists public.reviews (
  id           uuid        primary key default gen_random_uuid(),
  book_id      uuid        not null references public.books(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  display_name text        not null default '',
  rating       integer     not null check (rating between 1 and 5),
  comment      text        not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- One review per user per book
  constraint reviews_book_user_unique unique (book_id, user_id)
);

alter table public.reviews enable row level security;

create policy "Authenticated users can read reviews"
  on public.reviews for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can create reviews (not own book)"
  on public.reviews for insert
  with check (
    auth.uid() = user_id
    and auth.uid() != (select user_id from public.books where id = book_id)
  );

create policy "Users can update own reviews"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

create index if not exists reviews_book_id_idx on public.reviews(book_id);
create index if not exists reviews_user_id_idx on public.reviews(user_id);


-- ── 4. MUSIC ─────────────────────────────────────────────────
create table if not exists public.music (
  id            uuid        primary key default gen_random_uuid(),
  title         text        not null,
  artist        text        not null,
  mp3_url       text        not null,
  cover_url     text        not null default '',
  duration      integer     not null default 0,
  uploaded_by   uuid        not null references auth.users(id) on delete cascade,
  uploader_name text        not null default '',
  uploaded_at   timestamptz not null default now()
);

alter table public.music enable row level security;

create policy "Authenticated users can read music"
  on public.music for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can upload music"
  on public.music for insert
  with check (auth.uid() = uploaded_by);

create policy "Uploaders can delete own tracks"
  on public.music for delete
  using (auth.uid() = uploaded_by);

create policy "Uploaders can update own tracks"
  on public.music for update
  using (auth.uid() = uploaded_by);

create index if not exists music_uploaded_at_idx on public.music(uploaded_at desc);


-- ── 5. REALTIME ──────────────────────────────────────────────
-- Enable realtime for live updates on books and music
alter publication supabase_realtime add table public.books;
alter publication supabase_realtime add table public.reviews;
alter publication supabase_realtime add table public.music;
