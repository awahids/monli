-- Receipt photos: kept in the private "receipts" bucket at
-- <owner id>/<uuid>.<jpg|png|webp> and linked from the transactions made from them.
alter table saku.transactions add column receipt_path text
  check (receipt_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- Same access as the transactions: the first folder is the owner's id.
create policy "Receipts readable by space members" on storage.objects
  for select using (
    bucket_id = 'receipts' and (storage.foldername(name))[1] in (select o::text from saku.readable_owner_ids() o)
  );
create policy "Receipts writable by owner and editors" on storage.objects
  for insert with check (
    bucket_id = 'receipts' and (storage.foldername(name))[1] in (select o::text from saku.writable_owner_ids() o)
  );
create policy "Receipts deletable by owner and editors" on storage.objects
  for delete using (
    bucket_id = 'receipts' and (storage.foldername(name))[1] in (select o::text from saku.writable_owner_ids() o)
  );
