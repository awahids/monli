type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/** Rows per request: PostgREST's max_rows (1000 on Supabase, see supabase/config.toml). */
export const PAGE_ROWS = 1000;

/**
 * Every row of a query. PostgREST silently stops at max_rows per request, so
 * totals over longer lists came out too low. `page` builds the query for one
 * range; give it a stable order (e.g. by id) so pages do not overlap.
 */
export async function selectAll<T>(page: (from: number, to: number) => Page<T>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_ROWS) {
    const { data, error } = await page(from, from + PAGE_ROWS - 1);
    if (error) return { data: null, error };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_ROWS) return { data: rows, error: null };
  }
}
