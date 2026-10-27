-- More files per transaction (a warranty card, an invoice PDF) next to the
-- receipt photo: up to 5 paths in the receipts bucket, <owner id>/<uuid>.<ext>.
create function saku.valid_attachment_paths(paths text[]) returns boolean
  language sql immutable
  as $$ select coalesce(bool_and(p ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$'), true) from unnest(paths) p $$;

alter table saku.transactions add column attachments text[] not null default '{}'
  check (cardinality(attachments) <= 5 and saku.valid_attachment_paths(attachments));

update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
 where id = 'receipts';

-- Tags as one searchable string, so "kant" finds the tag "kantor".
create function saku.tags_text(tags text[]) returns text
  language sql immutable
  as $$ select array_to_string(tags, ' ') $$;

alter table saku.transactions add column tags_text text
  generated always as (saku.tags_text(tags)) stored;
