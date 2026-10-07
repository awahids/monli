/** Splits a whole amount into n parts that add up exactly; the first parts take the remainder. */
export function splitEvenly(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  return Array.from({ length: n }, (_, i) => base + (i < total - base * n ? 1 : 0));
}
