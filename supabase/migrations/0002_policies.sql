-- Culture Passport — row-level security, editor RPCs and public views.
-- Public visitors (anon) read published content only. Editors (rows in `editors`) write.
-- The service-role key is never needed by the web app.

create or replace function is_editor() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from editors where user_id = auth.uid());
$$;

create or replace function tradition_is_public(tid text) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from traditions where id = tid and status = 'published');
$$;

-- ── enable RLS everywhere ──
do $$
declare t text;
begin
  foreach t in array array[
    'sources','countries','places','communities','community_sources','organizations','organization_sources',
    'media_assets','traditions','tradition_slug_history','tradition_names','tradition_countries','tradition_places',
    'tradition_communities','tradition_sections','tradition_translations','claims','claim_sources','case_studies',
    'case_sources','case_questions','case_question_sources','events','event_sources','influences','influence_sources',
    'materials','material_sources','process_steps','process_step_sources','practitioners','practitioner_sources',
    'tradition_organizations','resources','related_traditions','relationships','relationship_sources','trails',
    'trail_steps','editors','qr_records','content_revisions','correction_requests'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ── registries: public read, editor write ──
do $$
declare t text;
begin
  foreach t in array array[
    'sources','countries','places','communities','community_sources','organizations','organization_sources',
    'media_assets','trails','trail_steps'
  ] loop
    execute format('drop policy if exists "%1$s public read" on %1$I', t);
    execute format('create policy "%1$s public read" on %1$I for select using (true)', t);
    execute format('drop policy if exists "%1$s editor write" on %1$I', t);
    execute format('create policy "%1$s editor write" on %1$I for all to authenticated using (is_editor()) with check (is_editor())', t);
  end loop;
end $$;

-- ── traditions: published rows are public; drafts are editors-only ──
drop policy if exists "traditions public read" on traditions;
create policy "traditions public read" on traditions for select using (status = 'published' or is_editor());
drop policy if exists "traditions editor write" on traditions;
create policy "traditions editor write" on traditions for all to authenticated using (is_editor()) with check (is_editor());

-- ── tables owned directly by a tradition ──
do $$
declare t text;
begin
  foreach t in array array[
    'tradition_slug_history','tradition_names','tradition_countries','tradition_places','tradition_communities',
    'tradition_sections','tradition_translations','claims','case_studies','events','influences','materials',
    'process_steps','practitioners','tradition_organizations','resources','related_traditions','relationships'
  ] loop
    execute format('drop policy if exists "%1$s public read" on %1$I', t);
    execute format('create policy "%1$s public read" on %1$I for select using (tradition_is_public(tradition_id) or is_editor())', t);
    execute format('drop policy if exists "%1$s editor write" on %1$I', t);
    execute format('create policy "%1$s editor write" on %1$I for all to authenticated using (is_editor()) with check (is_editor())', t);
  end loop;
end $$;

-- ── link tables, reached through their parent ──
create or replace function claim_is_public(cid text) returns boolean language sql stable security definer set search_path = public as
  $$ select exists (select 1 from claims c where c.id = cid and tradition_is_public(c.tradition_id)) $$;
create or replace function case_is_public(cid text) returns boolean language sql stable security definer set search_path = public as
  $$ select exists (select 1 from case_studies c where c.id = cid and tradition_is_public(c.tradition_id)) $$;
create or replace function event_is_public(eid text) returns boolean language sql stable security definer set search_path = public as
  $$ select exists (select 1 from events e where e.id = eid and tradition_is_public(e.tradition_id)) $$;

drop policy if exists "claim_sources public read" on claim_sources;
create policy "claim_sources public read" on claim_sources for select using (claim_is_public(claim_id) or is_editor());
drop policy if exists "event_sources public read" on event_sources;
create policy "event_sources public read" on event_sources for select using (event_is_public(event_id) or is_editor());
drop policy if exists "case_sources public read" on case_sources;
create policy "case_sources public read" on case_sources for select using (case_is_public(case_id) or is_editor());
drop policy if exists "case_questions public read" on case_questions;
create policy "case_questions public read" on case_questions for select using (case_is_public(case_id) or is_editor());
drop policy if exists "case_question_sources public read" on case_question_sources;
create policy "case_question_sources public read" on case_question_sources for select
  using (exists (select 1 from case_questions q where q.id = question_id and case_is_public(q.case_id)) or is_editor());
drop policy if exists "influence_sources public read" on influence_sources;
create policy "influence_sources public read" on influence_sources for select
  using (exists (select 1 from influences i where i.id = influence_id and tradition_is_public(i.tradition_id)) or is_editor());
drop policy if exists "material_sources public read" on material_sources;
create policy "material_sources public read" on material_sources for select
  using (exists (select 1 from materials m where m.id = material_id and tradition_is_public(m.tradition_id)) or is_editor());
drop policy if exists "process_step_sources public read" on process_step_sources;
create policy "process_step_sources public read" on process_step_sources for select
  using (exists (select 1 from process_steps p where p.id = step_id and tradition_is_public(p.tradition_id)) or is_editor());
drop policy if exists "practitioner_sources public read" on practitioner_sources;
create policy "practitioner_sources public read" on practitioner_sources for select
  using (exists (select 1 from practitioners p where p.id = practitioner_id and tradition_is_public(p.tradition_id)) or is_editor());
drop policy if exists "relationship_sources public read" on relationship_sources;
create policy "relationship_sources public read" on relationship_sources for select
  using (exists (select 1 from relationships r where r.id = relationship_id and tradition_is_public(r.tradition_id)) or is_editor());

do $$
declare t text;
begin
  foreach t in array array[
    'claim_sources','event_sources','case_sources','case_questions','case_question_sources','influence_sources',
    'material_sources','process_step_sources','practitioner_sources','relationship_sources'
  ] loop
    execute format('drop policy if exists "%1$s editor write" on %1$I', t);
    execute format('create policy "%1$s editor write" on %1$I for all to authenticated using (is_editor()) with check (is_editor())', t);
  end loop;
end $$;

-- ── editorial operations ──
drop policy if exists "editors read self" on editors;
create policy "editors read self" on editors for select to authenticated using (user_id = auth.uid() or is_editor());

drop policy if exists "qr editor" on qr_records;
create policy "qr editor" on qr_records for all to authenticated using (is_editor()) with check (is_editor());

drop policy if exists "revisions editor" on content_revisions;
create policy "revisions editor" on content_revisions for all to authenticated using (is_editor()) with check (is_editor());

-- Anyone may submit a correction; only editors may read or resolve them.
drop policy if exists "corrections public insert" on correction_requests;
create policy "corrections public insert" on correction_requests for insert to anon, authenticated
  with check (status = 'open' and resolution is null and resolved_by is null and tradition_is_public(tradition_id));
drop policy if exists "corrections editor" on correction_requests;
create policy "corrections editor" on correction_requests for all to authenticated using (is_editor()) with check (is_editor());

-- Public, non-personal change log for published passports.
create or replace view public_revision_log as
  select r.entity_id as tradition_id, r.at, r.summary
  from content_revisions r
  join traditions t on t.id = r.entity_id and t.status = 'published'
  where r.entity = 'tradition';

-- ── transactional save of a whole tradition (security invoker: RLS still applies) ──
create or replace function save_tradition(p jsonb) returns void
  language plpgsql security invoker set search_path = public as $$
declare
  tid text := p->'traditions'->0->>'id';
  t   text;
begin
  if tid is null then raise exception 'payload has no tradition'; end if;
  if not is_editor() then raise exception 'not an editor' using errcode = '42501'; end if;

  insert into traditions select * from jsonb_populate_recordset(null::traditions, p->'traditions')
    on conflict (id) do update set
      slug = excluded.slug, passport_no = excluded.passport_no, status = excluded.status, maturity = excluded.maturity,
      name = excluded.name, display_title = excluded.display_title, tagline = excluded.tagline, category = excluded.category,
      techniques = excluded.techniques, collection_iso2 = excluded.collection_iso2, region_label = excluded.region_label,
      summary = excluded.summary,
      intro = excluded.intro, accent = excluded.accent, motif = excluded.motif, hero_media_id = excluded.hero_media_id,
      gallery = excluded.gallery, periods = excluded.periods, voices_note = excluded.voices_note,
      collaboration_notes = excluded.collaboration_notes, editorial = excluded.editorial;

  -- Children are replaced wholesale; link tables follow by cascade.
  delete from tradition_names where tradition_id = tid;
  delete from tradition_countries where tradition_id = tid;
  delete from tradition_places where tradition_id = tid;
  delete from tradition_communities where tradition_id = tid;
  delete from tradition_sections where tradition_id = tid;
  delete from tradition_translations where tradition_id = tid;
  delete from claims where tradition_id = tid;
  delete from events where tradition_id = tid;
  delete from case_studies where tradition_id = tid;
  delete from influences where tradition_id = tid;
  delete from materials where tradition_id = tid;
  delete from process_steps where tradition_id = tid;
  delete from practitioners where tradition_id = tid;
  delete from tradition_organizations where tradition_id = tid;
  delete from resources where tradition_id = tid;
  delete from related_traditions where tradition_id = tid;

  foreach t in array array[
    'tradition_slug_history','tradition_names','tradition_countries','tradition_places','tradition_communities',
    'tradition_sections','tradition_translations','claims','claim_sources','case_studies','case_sources',
    'case_questions','case_question_sources','events','event_sources','influences','influence_sources','materials',
    'material_sources','process_steps','process_step_sources','practitioners','practitioner_sources',
    'tradition_organizations','resources','related_traditions'
  ] loop
    if jsonb_array_length(coalesce(p->t, '[]'::jsonb)) > 0 then
      if t = 'tradition_slug_history' then
        insert into tradition_slug_history select * from jsonb_populate_recordset(null::tradition_slug_history, p->t)
          on conflict (old_slug) do update set tradition_id = excluded.tradition_id;
      else
        execute format('insert into %1$I select * from jsonb_populate_recordset(null::%1$I, $1)', t) using p->t;
      end if;
    end if;
  end loop;
end $$;

grant execute on function save_tradition(jsonb) to authenticated;
grant select on public_revision_log to anon, authenticated;
