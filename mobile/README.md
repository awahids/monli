# Qala Saku untuk iOS dan Android

Aplikasi native ini adalah "cangkang" [Capacitor](https://capacitorjs.com) yang
membuka `https://monli.fun`. Semua tampilan dan fitur datang dari website, jadi
setiap deploy web langsung sampai ke aplikasi. Rilis baru ke App Store / Play
Store hanya perlu kalau bagian native berubah (plugin, ikon, izin, versi).

## Yang ditangani native

| Fitur | Di website | Di aplikasi |
| --- | --- | --- |
| Masuk dengan Google | redirect biasa | browser sistem, kembali lewat `qalasaku://auth/callback` |
| Masuk dengan Apple | - | hanya di iOS (wajib menurut App Store bila ada login Google) |
| Kunci sidik jari / Face ID | WebAuthn | plugin `@aparajita/capacitor-biometric-auth` |
| Catat lewat suara | Web Speech API | plugin `@capacitor-community/speech-recognition` |
| Export CSV | unduh file | lembar Bagikan (`@capacitor/filesystem` + `@capacitor/share`) |
| Upgrade PRO / riwayat bayar | Midtrans | disembunyikan; PRO dibeli di website dan ikut ke aplikasi |
| Banner "Pasang aplikasi" | tampil | disembunyikan |

Website mengenali aplikasi dari user agent `QalaSakuApp` (lihat `lib/native.ts`).

## Sekali saja sebelum rilis

1. **Supabase → Authentication → URL Configuration → Redirect URLs**: tambahkan
   `qalasaku://auth/callback**`.
2. **Supabase → Authentication → Providers → Apple**: aktifkan dan isi Services ID,
   Team ID, Key ID dan private key dari Apple Developer. Tanpa ini tombol
   "Lanjutkan dengan Apple" di iOS gagal, dan App Store bisa menolak aplikasi
   (guideline 4.8).
3. **Apple Developer**: buat App ID `digital.qala.saku` dengan kapabilitas
   *Sign in with Apple*.
4. **Google Play Console / App Store Connect**: daftarkan aplikasi dengan ID
   `digital.qala.saku`. ID ini permanen setelah dirilis; ganti `appId` di
   `capacitor.config.ts` sekarang kalau mau ID lain.

## Build

Perlu Node 20+. Android: Android Studio (SDK 35+). iOS: Mac dengan Xcode 16+.

```bash
cd mobile
npm install
npx cap sync          # setelah mengubah config, plugin atau www/
npx cap open android  # lalu Run / Build > Generate Signed Bundle
npx cap open ios      # lalu pilih tim signing, Run / Product > Archive
```

Mencoba versi preview atau server lokal tanpa mengubah config:

```bash
QALA_URL=https://monli-git-cabang-anda.vercel.app npx cap sync
QALA_URL=http://192.168.1.10:3000 npx cap sync   # HP dan laptop satu Wi-Fi
```

Kembalikan dengan `npx cap sync` biasa sebelum build rilis.

## Ikon dan splash

Sumbernya `assets/logo.png` (logo Qala 1024px, latar transparan). Setelah
menggantinya, jalankan `npm run assets` lalu `npx cap sync`.

## Offline

Setelah dibuka sekali dengan internet, service worker menyimpan halaman dan data
terakhir sehingga aplikasi tetap bisa dibuka offline (di iOS karena `monli.fun`
terdaftar di `WKAppBoundDomains`). Kalau belum pernah dibuka sama sekali, aplikasi
menampilkan `www/offline.html`.

## CI/CD

| Workflow | Kapan | Hasil |
| --- | --- | --- |
| `.github/workflows/mobile.yml` | setiap PR/push yang mengubah `mobile/` | build APK debug (bisa diunduh dari tab Actions, artefak `qala-saku-debug-apk`) dan build iOS simulator |
| `.github/workflows/mobile-release.yml` | push tag `mobile-v1.2.0`, atau tombol *Run workflow* di tab Actions | AAB bertanda tangan → Play **internal testing**, IPA → **TestFlight** |

Rilis baru:

```bash
git tag mobile-v1.0.0 && git push origin mobile-v1.0.0
```

Nomor versi di store diambil dari tag (`1.0.0`), nomor build dari nomor run
GitHub Actions sehingga selalu naik. Dari internal testing / TestFlight, rilis
ke publik dipromosikan manual di Play Console / App Store Connect.

### Secret yang perlu diisi

Simpan di **Settings → Environments → `mobile-release`** (bisa sekalian diberi
*Required reviewers* supaya setiap rilis perlu persetujuan).

Android:

| Secret | Isi |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | upload keystore, `base64 -w0 upload.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | password keystore |
| `ANDROID_KEY_ALIAS` | alias kunci di keystore |
| `ANDROID_KEY_PASSWORD` | password kunci |
| `PLAY_SERVICE_ACCOUNT_JSON` | isi file JSON service account Google Cloud yang diberi akses *Release apps to testing tracks* di Play Console → Users and permissions |

Membuat upload keystore (sekali, simpan baik-baik di luar repo):

```bash
keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

iOS:

| Secret | Isi |
| --- | --- |
| `APPLE_TEAM_ID` | Team ID 10 karakter (developer.apple.com → Membership) |
| `ASC_KEY_ID` | Key ID dari App Store Connect → Users and Access → Integrations → App Store Connect API (role **Admin**, karena sertifikat dibuat otomatis) |
| `ASC_ISSUER_ID` | Issuer ID di halaman yang sama |
| `ASC_KEY_P8` | isi file `AuthKey_XXXX.p8` |

Sertifikat dan provisioning profile tidak perlu disimpan: Xcode membuatnya
otomatis lewat API key (cloud-managed signing).

### Sekali di awal

- **Play Console**: buat aplikasi `digital.qala.saku`. Google meminta upload
  pertama dilakukan manual: jalankan rilis sekali, unduh artefak `qala-saku-aab`
  dari run tersebut (langkah upload ke Play akan gagal kali ini), lalu unggah ke
  *Internal testing*. Rilis berikutnya terunggah otomatis.
- Selama aplikasi belum pernah rilis ke publik, Play hanya menerima rilis
  berstatus draft (default workflow). Setelah rilis publik pertama, buat
  variabel repo `PLAY_RELEASE_STATUS` = `completed` agar rilis internal langsung
  aktif.
- **App Store Connect**: buat aplikasi baru dengan bundle ID `digital.qala.saku`
  sebelum upload pertama ke TestFlight.
