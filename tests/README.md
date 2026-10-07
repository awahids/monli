# E2E tests

Playwright tests run the app against a local Supabase started from
`supabase/config.toml` and `supabase/migrations`, so they exercise the real
schema, auth and row level security. CI (`.github/workflows/ci.yml`) runs
them on every pull request.

## Running locally

Needs Docker and the Supabase CLI.

```bash
supabase start
eval "$(supabase status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
export SUPABASE_URL=$API_URL SUPABASE_ANON_KEY=$ANON_KEY SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
export NEXT_PUBLIC_SUPABASE_URL=$API_URL NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
npm run test:e2e          # starts `npm run dev` unless something already runs on :3000
```

Each test that needs a user gets a fresh one from the `user` fixture
(`tests/fixtures.ts`): confirmed, with a profile, one account and one
category, deleted after the test. `newUser` is the same but still sees the
first-run onboarding.

Set `PW_CHROMIUM_PATH` to use a preinstalled Chromium instead of
`npx playwright install chromium`.
