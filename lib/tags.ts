export interface TagHistoryRow {
  note: string | null;
  categoryId: string | null;
  tags: string[];
}

/** Lowercase words of 3+ letters/digits, e.g. "Makan siang kantor" → makan, siang, kantor. */
export function tokenize(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 3);
}

/**
 * Suggests tags for a transaction from the user's own history:
 * - tags whose words appear in the note score highest,
 * - then tags of past transactions whose notes share words with this one,
 * - then tags often used with the chosen category.
 * Tags already on the transaction are left out (case-insensitive).
 */
export function suggestTags(
  history: TagHistoryRow[],
  input: { note?: string | null; categoryId?: string | null; exclude?: string[] },
  limit = 4,
): string[] {
  const noteWords = new Set(tokenize(input.note));
  const categoryId = input.categoryId ?? null;
  if (!noteWords.size && !categoryId) return [];

  const exclude = new Set((input.exclude ?? []).map((t) => t.toLowerCase()));
  const score = new Map<string, number>();
  const frequency = new Map<string, number>();
  const add = (tag: string, points: number) => score.set(tag, (score.get(tag) ?? 0) + points);

  for (const row of history) {
    const shared = tokenize(row.note).filter((w) => noteWords.has(w)).length;
    const weight = 2 * shared + (categoryId && row.categoryId === categoryId ? 1 : 0);
    for (const tag of row.tags) {
      frequency.set(tag, (frequency.get(tag) ?? 0) + 1);
      if (weight) add(tag, weight);
    }
  }
  for (const tag of Array.from(frequency.keys())) {
    if (tokenize(tag).some((w) => noteWords.has(w))) add(tag, 3);
  }

  return Array.from(score.entries())
    .filter(([tag]) => !exclude.has(tag.toLowerCase()))
    .sort((a, b) => b[1] - a[1] || (frequency.get(b[0]) ?? 0) - (frequency.get(a[0]) ?? 0) || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag);
}
