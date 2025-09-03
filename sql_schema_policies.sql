create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  title text,
  video_url text,
  user_id uuid references auth.users(id),
  created_at timestamp default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id),
  user_id uuid references auth.users(id),
  content text,
  created_at timestamp default now()
);

create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id),
  user_id uuid references auth.users(id),
  created_at timestamp default now()
);

alter table videos enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;

create policy "Users can insert their own videos"
on videos for insert
with check (auth.uid() = user_id);

create policy "Users can view all videos"
on videos for select
using (true);

create policy "Users can delete their own videos"
on videos for delete
using (auth.uid() = user_id);

create policy "Users can insert comments"
on comments for insert
with check (auth.uid() = user_id);

create policy "Users can view comments"
on comments for select
using (true);

create policy "Users can delete own comments"
on comments for delete
using (auth.uid() = user_id);

create policy "Users can insert likes"
on likes for insert
with check (auth.uid() = user_id);

create policy "Users can view likes"
on likes for select
using (true);
