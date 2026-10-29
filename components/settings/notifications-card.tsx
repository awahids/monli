'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { isNativeApp } from '@/lib/native';
import { NOTIFY_KEY, parseNotifySettings, type NotifySettings } from '@/lib/notifications';
import { notificationsPlugin } from '@/components/notifications/notification-sync';
import { useAppStore } from '@/lib/store';
import { disableWebPush, enableWebPush, sendTestPush, webPushState, type WebPushState } from '@/lib/web-push';
import { useT } from '@/lib/i18n';

type Status = 'loading' | 'web' | 'outdated' | 'granted' | 'denied' | 'prompt';

/** Web Push in the browser or installed web app; `unsupported` keeps the in-app budget alerts only. */
type WebStatus = WebPushState | 'busy';

/** Which reminders to get, and the phone's (or browser's) permission for them. */
export function NotificationsCard() {
  const { t } = useT();
  const [settings, setSettings] = useState<NotifySettings>(parseNotifySettings(null));
  const [status, setStatus] = useState<Status>('loading');
  const [web, setWeb] = useState<WebStatus>('unsupported');

  useEffect(() => {
    try {
      setSettings(parseNotifySettings(localStorage.getItem(NOTIFY_KEY)));
    } catch {}
    if (!isNativeApp()) {
      setStatus('web');
      webPushState().then(setWeb, () => setWeb('unsupported'));
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

  const setWebPush = async (on: boolean) => {
    setWeb('busy');
    try {
      setWeb(await (on ? enableWebPush() : disableWebPush()));
    } catch {
      setWeb(await webPushState().catch(() => 'unsupported' as const));
      toast.error(t('Notifikasi gagal dinyalakan. Coba lagi.', 'Could not turn on notifications. Try again.'));
    }
    // The home screen uploads the reminders once push is on.
    useAppStore.getState().bumpData();
  };

  const [testing, setTesting] = useState(false);
  const sendTest = async () => {
    setTesting(true);
    try {
      let ok = false;
      if (status === 'granted') {
        const plugin = await notificationsPlugin();
        await plugin?.schedule({
          notifications: [
            {
              id: 1,
              title: t('Tes notifikasi Qala Saku', 'Qala Saku test notification'),
              body: t('Notifikasi sudah sampai. Pengingatmu akan muncul seperti ini.', 'Notifications work. Your reminders will show up like this.'),
              schedule: { at: new Date(Date.now() + 1000) },
              extra: { source: 'saku-test', url: '/settings' },
            },
          ],
        });
        ok = !!plugin;
      } else {
        ok = await sendTestPush();
      }
      if (ok) toast.success(t('Notifikasi uji dikirim. Cek sebentar lagi.', 'Test notification sent. Check in a moment.'));
      else toast.error(t('Notifikasi uji tidak terkirim. Coba matikan lalu nyalakan lagi.', 'The test notification was not sent. Try turning notifications off and on again.'));
    } catch {
      toast.error(t('Notifikasi uji tidak terkirim. Coba matikan lalu nyalakan lagi.', 'The test notification was not sent. Try turning notifications off and on again.'));
    } finally {
      setTesting(false);
    }
  };

  const rows: { key: keyof NotifySettings; label: string; hint: string; phoneOnly: boolean }[] = [
    { key: 'bills', label: t('Tagihan besok', 'Bills due tomorrow'), hint: t('Pagi sebelum transaksi rutin atau setoran arisan jatuh tempo.', 'The morning before a recurring payment or arisan payment is due.'), phoneOnly: true },
    { key: 'budget', label: t('Budget hampir habis', 'Budget running low'), hint: t('Saat budget kategori mencapai 80% dan 100%.', 'When a category budget reaches 80% and 100%.'), phoneOnly: false },
    { key: 'daily', label: t('Pengingat harian', 'Daily reminder'), hint: t('Jam 20.00 kalau hari itu belum ada yang dicatat.', 'At 8 pm if nothing was recorded that day.'), phoneOnly: true },
    { key: 'weekly', label: t('Ringkasan mingguan', 'Weekly summary'), hint: t('Minggu jam 19.00: pengeluaran minggu ini dibanding minggu lalu.', 'Sunday at 7 pm: this week’s spending against last week’s.'), phoneOnly: true },
    { key: 'report', label: t('Laporan bulanan', 'Monthly report'), hint: t('Pagi pertama periode baru.', 'On the first morning of a new period.'), phoneOnly: true },
  ];
  const webPush = status === 'web' && (web === 'on' || web === 'off' || web === 'busy');
  const phone = (status !== 'web' && status !== 'outdated') || webPush;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('Notifikasi', 'Notifications')}
        </CardTitle>
        <CardDescription>
          {status === 'web' && webPush
            ? t('Pengingat dikirim ke browser ini, juga saat Qala Saku ditutup.', 'Reminders are sent to this browser, even when Qala Saku is closed.')
            : status === 'web' && web === 'install'
              ? t(
                  'Untuk menerima pengingat di iPhone, tambahkan Qala Saku ke Layar Utama (Bagikan > Tambahkan ke Layar Utama), lalu buka dari sana.',
                  'To get reminders on iPhone, add Qala Saku to your Home Screen (Share > Add to Home Screen), then open it from there.'
                )
              : status === 'web' && web === 'denied'
                ? t('Notifikasi untuk Qala Saku diblokir di pengaturan browser. Izinkan di sana untuk menerima pengingat.', 'Notifications for Qala Saku are blocked in your browser settings. Allow them there to get reminders.')
                : status === 'web'
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
        {webPush && (
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
            {web === 'on' ? <Bell className="h-5 w-5 shrink-0 text-primary" /> : <BellOff className="h-5 w-5 shrink-0 text-muted-foreground" />}
            <p className="flex-1 text-sm">
              {web === 'on'
                ? t('Notifikasi menyala di browser ini.', 'Notifications are on in this browser.')
                : t('Nyalakan notifikasi agar pengingat sampai walau Qala Saku ditutup.', 'Turn on notifications so reminders reach you even when Qala Saku is closed.')}
            </p>
            <Button size="sm" variant={web === 'on' ? 'outline' : 'default'} disabled={web === 'busy'} onClick={() => setWebPush(web !== 'on')}>
              {web === 'on' ? t('Matikan', 'Turn off') : t('Nyalakan', 'Turn on')}
            </Button>
          </div>
        )}
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
        {(status === 'granted' || web === 'on') && (
          <Button variant="outline" size="sm" className="w-full" disabled={testing} onClick={sendTest}>
            <Send className="mr-2 h-4 w-4" />
            {t('Kirim notifikasi uji', 'Send a test notification')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
