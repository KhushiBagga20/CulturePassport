-- Culture Passport — core schema (plain PostgreSQL, e.g. Neon)
-- Only the web server connects, with DATABASE_URL; the public never talks to the database directly.
-- A tradition may belong to several countries, places and communities; a source may
-- support many claims; events carry their own certainty. Stable text IDs + slugs.

create extension if not exists pgcrypto;

do $$ begin
  create type evidence_level as enum ('documented', 'community', 'interpretation', 'disputed', 'unverified');
exception when duplicate_object then null; end $$;
do $$ begin
  create type publication_status as enum ('draft', 'review', 'published');
exception when duplicate_object then null; end $$;
do $$ begin
  create type content_maturity as enum ('researched', 'starter', 'editorial-draft');
exception when duplicate_object then null; end $$;
do $$ begin
  create type country_status as enum ('active', 'introductory', 'documenting', 'shared');
exception when duplicate_object then null; end $$;

-- ───────────────────────────── shared registries ─────────────────────────────

create table if not exists sources (
  id          text primary key,
  title       text not null,
  publisher   text not null,
  author      text,
  date        text check (date is null or date ~ '^-?\d{4}(-\d{2}(-\d{2})?)?$'),
  url         text not null check (url ~ '^https?://'),
  type        text not null,
  accessed    date not null,
  notes       text
);

create table if not exists countries (
  iso2              char(2) primary key,
  iso_numeric       char(3) not null unique,
  slug              text not null unique,
  name              text not null,
  status            country_status not null,
  plate             text not null default '',
  headline          text not null default '',
  intro             text not null default '',
  candidates        jsonb not null default '[]'::jsonb,
  shared_traditions text[] not null default '{}',
  centroid_lon      double precision not null,
  centroid_lat      double precision not null
);

create table if not exists places (
  id           text primary key,
  name         text not null,
  kind         text not null,
  lat          double precision not null check (lat between -90 and 90),
  lon          double precision not null check (lon between -180 and 180),
  country_iso2 char(2) not null,
  note         text
);

create table if not exists communities (
  id          text primary key,
  name        text not null,
  description text not null
);
create table if not exists community_sources (
  community_id text not null references communities(id) on delete cascade,
  source_id    text not null references sources(id) on delete restrict,
  position     int not null default 0,
  primary key (community_id, source_id)
);

create table if not exists organizations (
  id       text primary key,
  name     text not null,
  kind     text not null,
  role     text not null,
  url      text,
  place_id text references places(id) on delete set null,
  verified boolean not null default false
);
create table if not exists organization_sources (
  organization_id text not null references organizations(id) on delete cascade,
  source_id       text not null references sources(id) on delete restrict,
  position        int not null default 0,
  primary key (organization_id, source_id)
);

create table if not exists media_assets (
  id           text primary key,
  commons_file text,
  commons_hash text,
  url          text,
  width        int not null check (width > 0),
  height       int not null check (height > 0),
  alt          text not null,
  caption      text not null,
  credit       text not null,
  license      text not null,
  license_url  text,
  source_page  text not null,
  kind         text not null,
  documentary  boolean not null default false,
  constraint media_has_location check (url is not null or (commons_file is not null and commons_hash is not null))
);

-- ───────────────────────────── traditions ─────────────────────────────

create table if not exists traditions (
  id                  text primary key,
  slug                text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  passport_no         text not null unique check (passport_no ~ '^\d{3,}$'),
  status              publication_status not null default 'draft',
  maturity            content_maturity not null default 'editorial-draft',
  name                text not null,
  display_title       text not null,
  tagline             text not null default '',
  category            text not null,
  techniques          text[] not null default '{}',
  collection_iso2     char(2) not null references countries(iso2),
  region_label        text not null default '',
  summary             text not null default '',
  intro               text not null default '',
  accent              text not null default 'terracotta',
  motif               text not null default 'kolhapuri',
  hero_media_id       text references media_assets(id) on delete set null,
  gallery             text[] not null default '{}',
  periods             text[] not null default '{}',
  voices_note         text not null default '',
  collaboration_notes text[] not null default '{}',
  editorial           jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  published_at        timestamptz
);
create index if not exists traditions_status_idx on traditions (status);
create index if not exists traditions_collection_idx on traditions (collection_iso2);

-- Old slugs keep printed QR codes working after a rename.
create table if not exists tradition_slug_history (
  old_slug     text primary key,
  tradition_id text not null references traditions(id) on delete cascade
);

create table if not exists tradition_names (
  id           text primary key,
  tradition_id text not null references traditions(id) on delete cascade,
  kind         text not null check (kind in ('native', 'alternate')),
  name         text not null,
  script       text,
  lang         text,
  note         text,
  position     int not null default 0
);
create index if not exists tradition_names_tradition_idx on tradition_names (tradition_id);
create index if not exists tradition_names_name_idx on tradition_names (lower(name));

create table if not exists tradition_countries (
  tradition_id text not null references traditions(id) on delete cascade,
  country_iso2 char(2) not null references countries(iso2),
  position     int not null default 0,
  primary key (tradition_id, country_iso2)
);
create index if not exists tradition_countries_country_idx on tradition_countries (country_iso2);

create table if not exists tradition_places (
  tradition_id text not null references traditions(id) on delete cascade,
  place_id     text not null references places(id),
  role         text not null,
  note         text,
  position     int not null default 0,
  primary key (tradition_id, place_id, role)
);

create table if not exists tradition_communities (
  tradition_id text not null references traditions(id) on delete cascade,
  community_id text not null references communities(id),
  role         text not null,
  position     int not null default 0,
  primary key (tradition_id, community_id)
);

-- Narrative chapters as typed block arrays, one row per chapter and locale.
create table if not exists tradition_sections (
  tradition_id text not null references traditions(id) on delete cascade,
  chapter      text not null check (chapter in ('origins', 'significance', 'makers', 'travels')),
  locale       text not null default 'en',
  blocks       jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks) = 'array'),
  primary key (tradition_id, chapter, locale)
);

-- Human-reviewed translations only; `reviewed` must be true before display.
create table if not exists tradition_translations (
  tradition_id text not null references traditions(id) on delete cascade,
  locale       text not null,
  name         text,
  tagline      text,
  summary      text,
  reviewed     boolean not null default false,
  primary key (tradition_id, locale)
);

-- ───────────────────────────── claims & evidence ─────────────────────────────

create table if not exists claims (
  id           text primary key,
  tradition_id text not null references traditions(id) on delete cascade,
  text         text not null,
  level        evidence_level not null,
  note         text,
  position     int not null default 0
);
create index if not exists claims_tradition_idx on claims (tradition_id);
create index if not exists claims_level_idx on claims (level);

create table if not exists claim_sources (
  claim_id  text not null references claims(id) on delete cascade,
  source_id text not null references sources(id) on delete restrict,
  position  int not null default 0,
  primary key (claim_id, source_id)
);
create index if not exists claim_sources_source_idx on claim_sources (source_id);

create table if not exists case_studies (
  id             text primary key,
  tradition_id   text not null references traditions(id) on delete cascade,
  slug           text not null,
  code           text not null,
  title          text not null,
  kind           text not null,
  parties        text[] not null default '{}',
  summary        text not null,
  status         text not null,
  travelled      text[] not null default '{}',
  left_behind    text[] not null default '{}',
  legal_note     text,
  comparison     jsonb,
  open_questions text[] not null default '{}',
  position       int not null default 0,
  unique (tradition_id, slug)
);

create table if not exists case_sources (
  case_id   text not null references case_studies(id) on delete cascade,
  source_id text not null references sources(id) on delete restrict,
  purpose   text not null default 'legal',
  position  int not null default 0,
  primary key (case_id, source_id, purpose)
);

create table if not exists case_questions (
  id       text primary key,
  case_id  text not null references case_studies(id) on delete cascade,
  q        text not null,
  a        text not null,
  level    evidence_level not null,
  position int not null default 0
);
create table if not exists case_question_sources (
  question_id text not null references case_questions(id) on delete cascade,
  source_id   text not null references sources(id) on delete restrict,
  position    int not null default 0,
  primary key (question_id, source_id)
);

-- Timeline milestones (tradition timelines and case chronologies).
create table if not exists events (
  id           text primary key,
  tradition_id text not null references traditions(id) on delete cascade,
  case_id      text references case_studies(id) on delete cascade,
  year         int not null,
  month        int check (month between 1 and 12),
  day          int check (day between 1 and 31),
  approx       boolean not null default false,
  date_label   text not null,
  title        text not null,
  body         text not null,
  level        evidence_level not null,
  place_id     text references places(id),
  tag          text,
  media_id     text references media_assets(id) on delete set null,
  position     int not null default 0
);
create index if not exists events_tradition_idx on events (tradition_id, year);
create index if not exists events_case_idx on events (case_id);

create table if not exists event_sources (
  event_id  text not null references events(id) on delete cascade,
  source_id text not null references sources(id) on delete restrict,
  position  int not null default 0,
  primary key (event_id, source_id)
);

create table if not exists influences (
  id           text primary key,
  tradition_id text not null references traditions(id) on delete cascade,
  title        text not null,
  body         text not null,
  level        evidence_level not null,
  position     int not null default 0
);
create table if not exists influence_sources (
  influence_id text not null references influences(id) on delete cascade,
  source_id    text not null references sources(id) on delete restrict,
  position     int not null default 0,
  primary key (influence_id, source_id)
);

create table if not exists materials (
  id           text primary key,
  tradition_id text not null references traditions(id) on delete cascade,
  name         text not null,
  detail       text not null,
  level        evidence_level not null,
  position     int not null default 0
);
create table if not exists material_sources (
  material_id text not null references materials(id) on delete cascade,
  source_id   text not null references sources(id) on delete restrict,
  position    int not null default 0,
  primary key (material_id, source_id)
);

create table if not exists process_steps (
  id           text primary key,
  tradition_id text not null references traditions(id) on delete cascade,
  title        text not null,
  detail       text not null,
  level        evidence_level not null,
  position     int not null default 0
);
create table if not exists process_step_sources (
  step_id   text not null references process_steps(id) on delete cascade,
  source_id text not null references sources(id) on delete restrict,
  position  int not null default 0,
  primary key (step_id, source_id)
);

-- Documented practitioners (public honours, published oral histories). Never invented.
create table if not exists practitioners (
  id           text primary key,
  tradition_id text not null references traditions(id) on delete cascade,
  name         text not null,
  note         text not null,
  position     int not null default 0
);
create table if not exists practitioner_sources (
  practitioner_id text not null references practitioners(id) on delete cascade,
  source_id       text not null references sources(id) on delete restrict,
  position        int not null default 0,
  primary key (practitioner_id, source_id)
);

create table if not exists tradition_organizations (
  tradition_id    text not null references traditions(id) on delete cascade,
  organization_id text not null references organizations(id),
  position        int not null default 0,
  primary key (tradition_id, organization_id)
);

create table if not exists resources (
  id           text primary key,
  tradition_id text not null references traditions(id) on delete cascade,
  title        text not null,
  url          text not null check (url ~ '^https?://'),
  note         text not null default '',
  source_id    text references sources(id) on delete set null,
  position     int not null default 0
);

create table if not exists related_traditions (
  tradition_id text not null references traditions(id) on delete cascade,
  related_id   text not null references traditions(id) on delete cascade,
  reason       text not null,
  position     int not null default 0,
  primary key (tradition_id, related_id),
  check (tradition_id <> related_id)
);

-- ───────────────────────────── roots & routes, trails ─────────────────────────────

create table if not exists relationships (
  id           text primary key,
  tradition_id text not null references traditions(id) on delete cascade,
  from_place   text not null references places(id),
  to_place     text not null references places(id),
  kind         text not null,
  title        text not null,
  description  text not null,
  level        evidence_level not null,
  year         text
);
create table if not exists relationship_sources (
  relationship_id text not null references relationships(id) on delete cascade,
  source_id       text not null references sources(id) on delete restrict,
  position        int not null default 0,
  primary key (relationship_id, source_id)
);

create table if not exists trails (
  slug     text primary key,
  title    text not null,
  kicker   text not null,
  intro    text not null,
  accent   text not null,
  position int not null default 0
);
create table if not exists trail_steps (
  trail_slug   text not null references trails(slug) on delete cascade,
  tradition_id text not null references traditions(id) on delete cascade,
  note         text not null,
  position     int not null default 0,
  primary key (trail_slug, position)
);

-- ───────────────────────────── editorial operations ─────────────────────────────

-- Editors sign in with the editor passcode (src/lib/auth.ts); the database stores their names, not accounts.


-- Every generated QR label is recorded, so printed codes can be audited.
create table if not exists qr_records (
  id           uuid primary key default gen_random_uuid(),
  tradition_id text not null references traditions(id) on delete cascade,
  target_url   text not null,
  format       text not null check (format in ('svg', 'png', 'label')),
  created_by   text,
  created_at   timestamptz not null default now()
);

-- Audit trail for significant edits to cultural claims.
create table if not exists content_revisions (
  id        uuid primary key default gen_random_uuid(),
  entity    text not null check (entity in ('tradition', 'source', 'media', 'country')),
  entity_id text not null,
  editor    text not null,
  at        timestamptz not null default now(),
  summary   text not null,
  fields    text[] not null default '{}',
  snapshot  jsonb
);
create index if not exists content_revisions_entity_idx on content_revisions (entity, entity_id, at desc);

-- Public correction requests, moderated by editors.
create table if not exists correction_requests (
  id           uuid primary key default gen_random_uuid(),
  tradition_id text not null references traditions(id) on delete cascade,
  claim_id     text,
  message      text not null check (char_length(message) between 10 and 4000),
  evidence_url text check (evidence_url is null or evidence_url ~ '^https?://'),
  contact      text check (contact is null or char_length(contact) <= 200),
  status       text not null default 'open' check (status in ('open', 'accepted', 'dismissed')),
  created_at   timestamptz not null default now(),
  resolution   text,
  resolved_by  text
);
create index if not exists correction_requests_status_idx on correction_requests (status, created_at desc);

-- Keep updated_at / published_at honest.
create or replace function touch_tradition() returns trigger language plpgsql as $$
begin
  new.created_at := coalesce(new.created_at, now());
  new.updated_at := now();
  if new.status = 'published' and (old is null or old.status <> 'published') then
    new.published_at := now();
  end if;
  return new;
end $$;

drop trigger if exists traditions_touch on traditions;
create trigger traditions_touch before insert or update on traditions
  for each row execute function touch_tradition();
