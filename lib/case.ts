const toCamel = (str: string) =>
  str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

/** Recursively converts snake_case keys from Supabase rows to camelCase. */
export function keysToCamel<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v)) as any;
  }
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[toCamel(key)] = keysToCamel(value);
    }
    return result as T;
  }
  return obj as T;
}
