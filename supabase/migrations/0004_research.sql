-- Culture Passport — research review queue.
-- The research pipeline (pipeline/run.mts) writes candidates here with the service-role key,
-- which bypasses row-level security and is never given to the web app. Candidates are not
-- content: the public cannot read them, editors can read and decide on them, and nobody can
-- publish from here. Turning a candidate into a passport creates a *draft* through the normal
-- editor RPC.

create table if not exists research_candidates (
  id            text primary key,                 -- "wd-Q1428368"
  country_iso2  char(2) not null,                 -- not a foreign key: the country may not be in the atlas yet
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

alter table research_candidates enable row level security;

drop policy if exists "research candidates editor read" on research_candidates;
create policy "research candidates editor read" on research_candidates
  for select to authenticated using (is_editor());

drop policy if exists "research candidates editor review" on research_candidates;
create policy "research candidates editor review" on research_candidates
  for update to authenticated using (is_editor()) with check (is_editor());

-- No insert or delete policy: only the pipeline (service role) adds candidates, and decisions are
-- kept as a status rather than deleted, so a refresh never resurrects a rejected candidate.

-- Countries added to the atlas from the research queue are recorded in the audit history.
alter table content_revisions drop constraint if exists content_revisions_entity_check;
alter table content_revisions add constraint content_revisions_entity_check
  check (entity in ('tradition', 'source', 'media', 'country'));
