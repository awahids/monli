# Legacy migrations

These built Qala Saku (then Monli) in the `public` schema of its first
Supabase project. The app now runs in the shared `awhids` project, in its own
`saku` schema; `supabase/migrations/20261005000000_saku_schema.sql` is the
final state of all of these, replayed into `saku`. Kept for history only; do
not apply them to the shared project.
