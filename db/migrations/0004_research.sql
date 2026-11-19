-- Culture Passport — research review queue.
-- The research pipeline (pipeline/run.mts) adds candidates; editors review them at /admin/research.
-- Candidates are never shown to the public, and nothing is published from here: turning one into
-- a passport creates a draft through save_tradition.

create table if not exists research_candidates (
  id            text primary key,                 -- "wd-Q1428368"
  country_iso2  char(2) not null,                 -- not a foreign key: the country may not be on the atlas yet
  wikidata_id   text not null,
  name          text not null,
  data          jsonb not null,                   -- the full ResearchCandidate (src/lib/research.ts)
  status        text not null default 'new' check (status in ('new', 'rejected', 'drafted')),
  fetched_at    timestamptz not null default now(),
  reviewed_by   text,
  reviewed_at   timestamptz,
  note          text,
  draft_id      text
);

create index if not exists research_candidates_country_idx on research_candidates (country_iso2, status);
