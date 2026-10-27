'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { isNativeApp } from '@/lib/native';
import { NOTIFY_KEY, parseNotifySettings, type NotifySettings } from '@/lib/notifications';
import { notificationsPlugin } from '@/components/notifications/notification-sync';
import { useAppStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

type Status = 'loading' | 'web' | 'outdated' | 'granted' | 'denied' | 'prompt';

/** Which reminders to get, and the phone's permission for them. */
export function NotificationsCard() {
  const { t } = useT();
  const [settings, setSettings] = useState<NotifySettings>(parseNotifySettings(null));
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    try {
      setSettings(parseNotifySettings(localStorage.getItem(NOTIFY_KEY)));
    } catch {}
    if (!isNativeApp()) {
      setStatus('web');
      return;
    }
    notificationsPlugin().then(async (plugin) => {
      if (!plugin) return setStatus('outdated');
      const { display } = await plugin.checkPermissions();
      setStatus(display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt');
    });
  }, []);

  const toggle = (key: keyof NotifySettings, on: boolean) => {
    const next = { ...settings, [key]: on };
    setSettings(next);
    try {
      localStorage.setItem(NOTIFY_KEY, JSON.stringify(next));
    } catch {}
    // The home screen reschedules with the new choices.
    useAppStore.getState().bumpData();
  };

  const allow = async () => {
    const plugin = await notificationsPlugin();
    if (!plugin) return;
    const { display } = await plugin.requestPermissions();
    setStatus(display === 'granted' ? 'granted' : 'denied');
    useAppStore.getState().bumpData();
  };

  const rows: { key: keyof NotifySettings; label: string; hint: string; phoneOnly: boolean }[] = [
    { key: 'bills', label: t('Tagihan besok', 'Bills due tomorrow'), hint: t('Pagi sebelum transaksi rutin jatuh tempo.', 'The morning before a recurring payment is due.'), phoneOnly: true },
    { key: 'budget', label: t('Budget hampir habis', 'Budget running low'), hint: t('Saat budget kategori mencapai 80% dan 100%.', 'When a category budget reaches 80% and 100%.'), phoneOnly: false },
    { key: 'daily', label: t('Pengingat harian', 'Daily reminder'), hint: t('Jam 20.00 kalau hari itu belum ada yang dicatat.', 'At 8 pm if nothing was recorded that day.'), phoneOnly: true },
    { key: 'report', label: t('Laporan bulanan', 'Monthly report'), hint: t('Pagi pertama periode baru.', 'On the first morning of a new period.'), phoneOnly: true },
  ];
  const phone = status !== 'web' && status !== 'outdated';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('Notifikasi', 'Notifications')}
        </CardTitle>
        <CardDescription>
          {status === 'web'
            ? t(
                'Pengingat ke HP tersedia di aplikasi Qala Saku untuk iOS dan Android. Di web, peringatan budget muncul di dalam aplikasi.',
                'Phone reminders are in the Qala Saku app for iOS and Android. On the web, budget alerts show inside the app.'
              )
            : status === 'outdated'
              ? t('Perbarui aplikasi Qala Saku dari App Store atau Play Store untuk menyalakan notifikasi.', 'Update the Qala Saku app from the App Store or Play Store to turn on notifications.')
              : t('Diatur di perangkat ini.', 'Set on this device.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(status === 'prompt' || status === 'denied') && (
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
            <BellOff className="h-5 w-5 shrink-0 text-muted-foreground" />
            <p className="flex-1 text-sm">
              {status === 'denied'
                ? t('Notifikasi dimatikan di pengaturan HP. Nyalakan untuk Qala Saku di sana.', 'Notifications are off in your phone settings. Turn them on for Qala Saku there.')
                : t('Izinkan Qala Saku mengirim notifikasi.', 'Let Qala Saku send notifications.')}
            </p>
            {status === 'prompt' && (
              <Button size="sm" onClick={allow}>
                {t('Izinkan', 'Allow')}
              </Button>
            )}
          </div>
        )}
        {rows
          .filter((r) => phone || !r.phoneOnly)
          .map((r) => (
            <div key={r.key} className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor={`notify-${r.key}`}>{r.label}</Label>
                <p className="text-xs text-muted-foreground">{r.hint}</p>
              </div>
              <Switch id={`notify-${r.key}`} checked={settings[r.key]} onCheckedChange={(on) => toggle(r.key, on)} />
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
