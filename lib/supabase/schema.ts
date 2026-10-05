/**
 * Qala Saku shares the "awhids" Supabase project (and its users, including
 * Google sign-in) with other apps, so its tables live in their own schema.
 * Every client must pass this; the schema must also be listed under
 * Dashboard > Project Settings > Data API > Exposed schemas.
 */
export const DB_SCHEMA = 'saku' as const;
