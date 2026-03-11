create table if not exists song_loops (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade,
  link_id uuid not null references song_links(id) on delete cascade,
  user_id uuid not null,
  name text not null,
  loop_start double precision not null check (loop_start >= 0),
  loop_end double precision not null check (loop_end > loop_start),
  created_at timestamptz default now()
);

create index if not exists song_loops_song_id_idx on song_loops(song_id);
create index if not exists song_loops_link_id_idx on song_loops(link_id);
create index if not exists song_loops_user_id_idx on song_loops(user_id);

alter table song_loops enable row level security;

create policy "Users can view their own song loops"
on song_loops
for select
using (auth.uid() = user_id);

create policy "Users can create their own song loops"
on song_loops
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own song loops"
on song_loops
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own song loops"
on song_loops
for delete
using (auth.uid() = user_id);
