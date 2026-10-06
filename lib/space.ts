/**
 * Shared spaces ("Kelola bersama"): a PRO owner invites people who then work
 * inside the owner's data. The active space is the owner's profile id, kept in
 * a cookie so API routes and client queries agree on whose rows to use.
 */
export const SPACE_COOKIE = 'saku_space';

export const SPACE_MEMBER_LIMIT = 4;

export type SpaceRole = 'owner' | 'editor' | 'viewer';

export const SPACE_ROLE_LABEL: Record<SpaceRole, string> = {
  owner: 'Pemilik',
  editor: 'Editor',
  viewer: 'Pemantau',
};

export const SPACE_ROLE_HINT: Record<Exclude<SpaceRole, 'owner'>, string> = {
  editor: 'Bisa mencatat dan mengubah transaksi, akun, budget, dan target.',
  viewer: 'Hanya bisa melihat, tidak bisa mengubah apa pun.',
};

export const READ_ONLY_MESSAGE = 'Kamu hanya bisa melihat di ruang ini. Minta pemilik menjadikanmu Editor untuk mengubah data.';

/** Errors raised by the invite RPCs, in words for the person accepting. */
export const INVITE_ERROR_MESSAGE: Record<string, string> = {
  invite_not_found: 'Undangan tidak ditemukan atau sudah dipakai.',
  invite_used: 'Undangan ini sudah dipakai.',
  email_mismatch: 'Undangan ini untuk email lain. Masuk dengan email yang diundang.',
  own_space: 'Ini undangan ke ruangmu sendiri.',
  owner_not_pro: 'Pengundang tidak lagi berlangganan PRO, jadi ruang bersama tidak aktif.',
  not_authenticated: 'Masuk dulu untuk menerima undangan.',
  member_limit: `Ruang bersama sudah penuh (maksimal ${SPACE_MEMBER_LIMIT} anggota).`,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined | null): value is string {
  return !!value && UUID_RE.test(value);
}

export function inviteErrorMessage(raw: string | undefined): string {
  if (!raw) return 'Gagal memproses undangan.';
  const key = Object.keys(INVITE_ERROR_MESSAGE).find((k) => raw.includes(k));
  return key ? INVITE_ERROR_MESSAGE[key] : 'Gagal memproses undangan.';
}
