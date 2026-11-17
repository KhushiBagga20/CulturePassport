-- Culture Passport — Supabase Storage for permitted images.
-- Public read (images appear on public passports); only editors may upload or delete.
-- Every uploaded file must also get a media_assets row with its licence and credit.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');

drop policy if exists "media editor insert" on storage.objects;
create policy "media editor insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_editor());

drop policy if exists "media editor update" on storage.objects;
create policy "media editor update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_editor());

drop policy if exists "media editor delete" on storage.objects;
create policy "media editor delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_editor());
