-- Culture Passport — server-side functions.
-- save_tradition replaces a passport and all of its child rows in one transaction.
-- The app calls it only after checking the editor session (requireEditor).

create or replace function save_tradition(p jsonb) returns void
  language plpgsql security invoker set search_path = public as $$
declare
  tid text := p->'traditions'->0->>'id';
  t   text;
begin
  if tid is null then raise exception 'payload has no tradition'; end if;

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
