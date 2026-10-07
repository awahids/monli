'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint, Lock } from 'lucide-react';
import { toast } from 'sonner';
import {
  PIN_LENGTH,
  RELOCK_AFTER_MS,
  biometricAvailable,
  checkPin,
  makeLock,
  readLock,
  registerBiometric,
  verifyBiometric,
  writeLock,
  type LockConfig,
} from '@/lib/app-lock';
import { signOut } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useT } from '@/lib/i18n';

const MAX_ATTEMPTS = 5;

/** The device's lock settings, kept in step across components and tabs. */
function useLock(): LockConfig | null {
  const [lock, setLock] = useState<LockConfig | null>(null);
  useLayoutEffect(() => {
    const sync = () => setLock(readLock());
    sync();
    window.addEventListener('qala-app-lock', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('qala-app-lock', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return lock;
}

function PinInput({ id, value, onChange, label }: { id: string; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <Input
      id={id}
      type="password"
      inputMode="numeric"
      autoComplete="off"
      maxLength={PIN_LENGTH}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      className="text-center text-2xl tracking-[0.5em]"
    />
  );
}

/** Covers the app until the PIN or biometric check passes. */
export function AppLockGate() {
  const lock = useLock();
  const router = useRouter();
  const { t } = useT();
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');

  // Lock before the first paint when this device has a PIN.
  useLayoutEffect(() => {
    if (readLock()) setLocked(true);
  }, []);

  // Lock again after the app sat in the background for a while.
  useEffect(() => {
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (readLock() && hiddenAt && Date.now() - hiddenAt > RELOCK_AFTER_MS) setLocked(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const unlock = () => {
    setLocked(false);
    setPin('');
    setAttempts(0);
    setError('');
  };

  const leave = useCallback(async () => {
    await signOut().catch(() => undefined);
    unlock();
    router.replace('/auth/sign-in');
  }, [router]);

  const submit = async (value: string) => {
    if (!lock || value.length < PIN_LENGTH) return;
    if (await checkPin(lock, value)) return unlock();
    const next = attempts + 1;
    setPin('');
    if (next >= MAX_ATTEMPTS) {
      toast.error(t('Terlalu banyak salah PIN. Silakan masuk lagi.', 'Too many wrong PINs. Please sign in again.'));
      await leave();
      return;
    }
    setAttempts(next);
    setError(t(`PIN salah. Sisa ${MAX_ATTEMPTS - next} kali coba.`, `Wrong PIN. ${MAX_ATTEMPTS - next} tries left.`));
  };

  if (!locked || !lock) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('Aplikasi terkunci', 'App locked')}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background px-8"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Lock className="h-6 w-6" />
      </span>
      <div className="text-center">
        <h2 className="text-xl font-bold">{t('Masukkan PIN', 'Enter PIN')}</h2>
        <p className="text-sm text-muted-foreground">{t('Qala Saku terkunci di perangkat ini.', 'Qala Saku is locked on this device.')}</p>
      </div>
      <div className="w-full max-w-xs space-y-2">
        <PinInput
          id="unlock-pin"
          label="PIN"
          value={pin}
          onChange={(v) => {
            setPin(v);
            setError('');
            if (v.length === PIN_LENGTH) submit(v);
          }}
        />
        {error && (
          <p role="alert" className="text-center text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      {lock.credentialId && (
        <Button
          variant="outline"
          onClick={async () => (await verifyBiometric(lock.credentialId!)) && unlock()}
        >
          <Fingerprint className="mr-2 h-4 w-4" /> {t('Pakai sidik jari / Face ID', 'Use fingerprint / Face ID')}
        </Button>
      )}
      <button type="button" className="text-sm text-muted-foreground underline-offset-4 hover:underline" onClick={leave}>
        {t('Lupa PIN? Keluar dan masuk lagi', 'Forgot PIN? Sign out and back in')}
      </button>
    </div>
  );
}

/** Settings: turn the PIN lock and biometric unlock on or off. */
export function AppLockCard() {
  const { user } = useAppStore();
  const { t } = useT();
  const lock = useLock();
  const [canBiometric, setCanBiometric] = useState(false);
  const [mode, setMode] = useState<'set' | 'remove' | null>(null);
  const [pin, setPin] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    biometricAvailable().then(setCanBiometric);
  }, []);

  const open = (m: 'set' | 'remove') => {
    setPin('');
    setRepeat('');
    setError('');
    setMode(m);
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== PIN_LENGTH) return setError(t(`PIN harus ${PIN_LENGTH} angka`, `PIN must be ${PIN_LENGTH} digits`));
    if (mode === 'set') {
      if (pin !== repeat) return setError(t('PIN tidak sama', "PINs don't match"));
      writeLock(await makeLock(pin));
      toast.success(t('Kunci aplikasi aktif', 'App lock is on'));
    } else if (lock) {
      if (!(await checkPin(lock, pin))) return setError(t('PIN salah', 'Wrong PIN'));
      writeLock(null);
      toast.success(t('Kunci aplikasi dimatikan', 'App lock is off'));
    }
    setMode(null);
  };

  const toggleBiometric = async (on: boolean) => {
    if (!lock || !user) return;
    try {
      writeLock({ ...lock, credentialId: on ? await registerBiometric(user.id, user.email ?? 'Qala Saku') : undefined });
    } catch {
      toast.error(t('Sidik jari / Face ID tidak bisa diaktifkan', 'Could not turn on fingerprint / Face ID'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Keamanan', 'Security')}</CardTitle>
        <CardDescription>{t('Minta PIN setiap kali aplikasi dibuka di perangkat ini.', 'Ask for a PIN every time the app opens on this device.')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>{t('Kunci dengan PIN', 'Lock with PIN')}</span>
          <Switch checked={!!lock} onCheckedChange={(on) => open(on ? 'set' : 'remove')} />
        </label>
        {lock && canBiometric && (
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>{t('Buka dengan sidik jari / Face ID', 'Unlock with fingerprint / Face ID')}</span>
            <Switch checked={!!lock.credentialId} onCheckedChange={toggleBiometric} />
          </label>
        )}
      </CardContent>

      <Dialog open={mode !== null} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === 'set' ? t('Buat PIN', 'Create PIN') : t('Matikan kunci', 'Turn off lock')}</DialogTitle>
            <DialogDescription>
              {mode === 'set'
                ? t(`${PIN_LENGTH} angka, hanya tersimpan di perangkat ini.`, `${PIN_LENGTH} digits, kept only on this device.`)
                : t('Masukkan PIN saat ini.', 'Enter your current PIN.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirm} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lock-pin">PIN</Label>
              <PinInput id="lock-pin" label="PIN" value={pin} onChange={setPin} />
            </div>
            {mode === 'set' && (
              <div className="space-y-2">
                <Label htmlFor="lock-repeat">{t('Ulangi PIN', 'Repeat PIN')}</Label>
                <PinInput id="lock-repeat" label={t('Ulangi PIN', 'Repeat PIN')} value={repeat} onChange={setRepeat} />
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" className="w-full">
                {mode === 'set' ? t('Aktifkan', 'Turn on') : t('Matikan', 'Turn off')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
