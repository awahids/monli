# Qala Saku

## Changelog

Every change users can notice adds a line to `lib/changelog.ts` in the same PR.
One entry per day, and the day is the version (`YYYY.MM.DD`): add to the top
entry if it is today's, otherwise start a new entry above it. Items are short
Indonesian sentences typed `baru`, `peningkatan` or `perbaikan`. The page
"Yang baru" (`/changelog`) and the app version shown in Settings read from it.

## Checks

CI runs these on every PR; run them before pushing:

- `npm run lint`
- `npx tsc --noEmit`
- `npm test` (unit tests in `lib/*.test.ts`)
- `npm run test:e2e` against a local Supabase (see `tests/README.md`)
