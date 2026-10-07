export type Locale = 'id' | 'en';
export const LOCALE_COOKIE = 'qala-locale';
export const asLocale = (value?: string | null): Locale => (value === 'en' ? 'en' : 'id');

/** t(id, en): picks one of the two texts written side by side. */
export type Translate = (idText: string, enText: string) => string;
/** Default for shared helpers called without a language (server code, tests). */
export const indonesian: Translate = (idText) => idText;
