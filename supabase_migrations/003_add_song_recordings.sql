create table if not exists song_recordings (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade,
  user_id uuid not null,
  file_name text not null,
  file_url text not null,
  storage_path text,
  created_at timestamptz default now()
);

alter table song_notes
  add column if not exists recording_id uuid references song_recordings(id) on delete set null;

create index if not exists song_recordings_song_id_idx on song_recordings(song_id);
create index if not exists song_notes_recording_id_idx on song_notes(recording_id);
