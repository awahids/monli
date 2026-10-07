/**
 * App lock: a PIN (and optionally the phone's fingerprint / Face ID) asked
 * before the app shows anything on this device. It guards against someone
 * picking up an unlocked phone; signing in stays the real authentication, so
 * "Lupa PIN" just signs out. Kept per device in localStorage.
 */
export type LockConfig = { salt: string; hash: string; credentialId?: string };

const KEY = 'qala-app-lock';
/** Re-lock after the app has been in the background this long. */
export const RELOCK_AFTER_MS = 60_000;
export const PIN_LENGTH = 6;

const b64 = (bytes: ArrayBuffer | Uint8Array) => btoa(Array.from(new Uint8Array(bytes), (b) => String.fromCharCode(b)).join(''));
const unb64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

export async function hashPin(pin: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: unb64(salt), iterations: 100_000 },
    key,
    256
  );
  return b64(bits);
}

export async function makeLock(pin: string): Promise<LockConfig> {
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  return { salt, hash: await hashPin(pin, salt) };
}

export async function checkPin(lock: LockConfig, pin: string): Promise<boolean> {
  return (await hashPin(pin, lock.salt)) === lock.hash;
}

export function readLock(): LockConfig | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LockConfig) : null;
  } catch {
    return null;
  }
}

export function writeLock(lock: LockConfig | null) {
  try {
    if (lock) localStorage.setItem(KEY, JSON.stringify(lock));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the lock simply stays off.
  }
  window.dispatchEvent(new Event('qala-app-lock'));
}

/** Whether this device has a fingerprint / Face ID sensor the browser can use. */
export async function biometricAvailable(): Promise<boolean> {
  try {
    return !!window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  } catch {
    return false;
  }
}

/**
 * Registers a passkey on this device used only as a local presence check
 * (WebAuthn with user verification); returns its id.
 */
export async function registerBiometric(userId: string, name: string): Promise<string> {
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'Qala Saku' },
      user: { id: new TextEncoder().encode(userId), name, displayName: name },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error('Dibatalkan');
  return b64(credential.rawId);
}

/** Asks for the fingerprint / Face ID; true when the user verified. */
export async function verifyBiometric(credentialId: string): Promise<boolean> {
  try {
    const result = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: unb64(credentialId) }],
        userVerification: 'required',
        timeout: 60_000,
      },
    });
    return !!result;
  } catch {
    return false;
  }
}
