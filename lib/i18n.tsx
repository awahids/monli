'use client';

import { createContext, useContext, useEffect } from 'react';
import { enUS, id as idLocale } from 'date-fns/locale';
import { asLocale, LOCALE_COOKIE, type Locale } from './locale';

/**
 * Two languages, written side by side where they are used: t('Simpan', 'Save').
 * The choice lives in a cookie so server and client render the same text, and
 * switching reloads the page.
 */
export { asLocale, LOCALE_COOKIE, type Locale };

const LocaleContext = createContext<Locale>('id');
let current: Locale = 'id';

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  // For code outside components (toasts, helpers); only ever read in the browser.
  if (typeof window !== 'undefined') current = locale;
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

function tools(locale: Locale) {
  const en = locale === 'en';
  return {
    locale,
    t: (idText: string, enText: string) => (en ? enText : idText),
    /** For date-fns `format(..., { locale })`. */
    dateLocale: en ? enUS : idLocale,
    /** For Intl date and number formatting. */
    intl: en ? 'en-US' : 'id-ID',
  };
}

export type I18n = ReturnType<typeof tools>;

// One object per language, so `t` is stable and safe in hook dependencies.
const TOOLS = { id: tools('id'), en: tools('en') };

/**
 * English for the validation messages in the schemas (lib/validation and the
 * form schemas), which are written once, in Indonesian, at module level.
 */
const MESSAGES_EN: Record<string, string> = {
  'Pilih akun': 'Choose an account',
  'Pilih akun asal': 'Choose the source account',
  'Pilih akun tujuan': 'Choose the destination account',
  'Akun asal dan tujuan harus berbeda': 'Source and destination must differ',
  'Pilih dua akun yang berbeda': 'Choose two different accounts',
  'Pilih tanggal': 'Choose a date',
  'Pilih bulan budget': 'Choose the budget month',
  'Tanggal selesai sebelum tanggal mulai': 'The end date is before the start date',
  'Nominal tidak boleh 0': 'Amount cannot be 0',
  'Isi nama': 'Enter a name',
  'Masukkan nominal': 'Enter an amount',
  'Nama akun wajib diisi': 'Account name is required',
  'Saldo awal tidak boleh negatif': 'The opening balance cannot be negative',
  'Format email tidak valid': 'Invalid email format',
  'Kata sandi minimal 6 karakter': 'The password needs at least 6 characters',
  'Nama minimal 2 karakter': 'The name needs at least 2 characters',
  'Konfirmasi kata sandi tidak sama': "Passwords don't match",
};

/** A schema's validation message in the page language. */
export function useMessage() {
  const { t } = useT();
  return (text: string) => t(text, MESSAGES_EN[text] ?? text);
}

export function useT(): I18n {
  return TOOLS[useContext(LocaleContext)];
}

/** Outside render (event handlers, toasts): the language of this page. */
export const tr = (idText: string, enText: string) => TOOLS[current].t(idText, enText);

export function setLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  window.location.reload();
}
