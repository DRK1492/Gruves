alter table song_notes
  add column if not exists link_id uuid references song_links(id) on delete set null,
  add column if not exists file_id uuid references song_files(id) on delete set null;

create index if not exists song_notes_link_id_idx on song_notes(link_id);
create index if not exists song_notes_file_id_idx on song_notes(file_id);
