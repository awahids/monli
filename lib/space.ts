/**
 * Shared spaces ("Kelola bersama"): a PRO owner invites people who then work
 * inside the owner's data. The active space is the owner's profile id, kept in
 * a cookie so API routes and client queries agree on whose rows to use.
 */
export const SPACE_COOKIE = 'saku_space';

export const SPACE_MEMBER_LIMIT = 4;

export type SpaceRole = 'owner' | 'editor' | 'viewer';

/** Text in both languages: pass to t(...text). */
type Text = [id: string, en: string];

export const SPACE_ROLE_LABEL: Record<SpaceRole, Text> = {
  owner: ['Pemilik', 'Owner'],
  editor: ['Editor', 'Editor'],
  viewer: ['Pemantau', 'Viewer'],
};

export const SPACE_ROLE_HINT: Record<Exclude<SpaceRole, 'owner'>, Text> = {
  editor: ['Bisa mencatat dan mengubah transaksi, akun, budget, dan target.', 'Can record and change transactions, accounts, budgets and goals.'],
  viewer: ['Hanya bisa melihat, tidak bisa mengubah apa pun.', 'Can only view, not change anything.'],
};

export const READ_ONLY_MESSAGE: Text = [
  'Kamu hanya bisa melihat di ruang ini. Minta pemilik menjadikanmu Editor untuk mengubah data.',
  'You can only view this space. Ask the owner to make you an Editor to change data.',
];

/** Errors raised by the invite RPCs, in words for the person accepting. */
export const INVITE_ERROR_MESSAGE: Record<string, Text> = {
  invite_not_found: ['Undangan tidak ditemukan atau sudah dipakai.', 'Invite not found or already used.'],
  invite_used: ['Undangan ini sudah dipakai.', 'This invite has already been used.'],
  email_mismatch: ['Undangan ini untuk email lain. Masuk dengan email yang diundang.', 'This invite is for another email. Sign in with the invited email.'],
  own_space: ['Ini undangan ke ruangmu sendiri.', 'This is an invite to your own space.'],
  owner_not_pro: ['Pengundang tidak lagi berlangganan PRO, jadi ruang bersama tidak aktif.', 'The inviter no longer has PRO, so the shared space is inactive.'],
  not_authenticated: ['Masuk dulu untuk menerima undangan.', 'Sign in first to accept the invite.'],
  member_limit: [`Ruang bersama sudah penuh (maksimal ${SPACE_MEMBER_LIMIT} anggota).`, `The shared space is full (max ${SPACE_MEMBER_LIMIT} members).`],
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined | null): value is string {
  return !!value && UUID_RE.test(value);
}

export function inviteErrorMessage(raw: string | undefined, t: (id: string, en: string) => string): string {
  const key = raw && Object.keys(INVITE_ERROR_MESSAGE).find((k) => raw.includes(k));
  return key ? t(...INVITE_ERROR_MESSAGE[key]) : t('Gagal memproses undangan.', 'Could not process the invite.');
}
