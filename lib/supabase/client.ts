import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { DB_SCHEMA } from "./schema";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: DB_SCHEMA } },
  );
}

export const supabase = createClient();
