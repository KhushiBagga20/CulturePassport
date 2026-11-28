-- Culture Passport — images uploaded through the editorial desk.
-- Stored in the database (8 MB limit, also enforced by the app) and served by /api/media/[file],
-- so no separate file-storage service is needed.

create table if not exists media_files (
  id           text primary key,                -- "upload-1a2b3c4d.jpg"
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  bytes        bytea not null check (octet_length(bytes) <= 8 * 1024 * 1024),
  created_at   timestamptz not null default now()
);
