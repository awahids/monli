-- Profile pictures (components/brand/cartoon-avatar.tsx, app/api/profile/avatar):
-- * every account has a drawn cartoon, picked from avatar_seed (the account id
--   while it is null; "Acak lagi" stores a new one);
-- * PRO can turn a photo into a cartoon with AI. Only the cartoon is kept, in
--   the private "avatars" bucket at <user id>/<uuid>.<png|webp>; the photo itself
--   is never stored.

alter table saku.profiles
  add column avatar_seed text check (avatar_seed ~ '^[0-9a-f]{8}$'),
  add column avatar_path text check (avatar_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|webp)$');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 4194304, array['image/png', 'image/webp']);

-- Written only by the server after the AI turns a photo into a cartoon, so
-- there is no insert policy; people read and delete their own.
create policy "Avatars readable by their owner" on storage.objects
  for select using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Avatars deletable by their owner" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
