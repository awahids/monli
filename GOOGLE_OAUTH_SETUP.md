# Login Google & project Supabase

Qala Saku memakai project Supabase **awhids** (`ebpppfegdesvubxqnmye`) bersama app
lain. Pengguna (`auth.users`) dan login Google dipakai bersama; semua tabel Qala Saku
ada di schema **`saku`** supaya tidak bentrok dengan tabel app lain di `public`.

## Alur
1. Tombol "Lanjutkan dengan Google" (`components/auth/google-sign-in.tsx`) memanggil
   `supabase.auth.signInWithOAuth({ provider: 'google' })` dengan
   `redirectTo = <origin>/auth/callback?next=/dashboard`.
2. Google → Supabase (`https://ebpppfegdesvubxqnmye.supabase.co/auth/v1/callback`) →
   kembali ke `/auth/callback` di app.
3. `app/auth/callback/route.ts` menukar `code` jadi sesi (cookie), membuat profil
   `saku.profiles` kalau belum ada (paket FREE), mengisi kategori default, lalu
   redirect ke `next`.

Akun yang sudah ada di project (dari app lain atau login Google) otomatis dibuatkan
profil Qala Saku saat pertama kali masuk (`lib/profile.ts#ensureProfile`).

## Setting yang diperlukan (sekali)
1. **Dashboard → Project Settings → Data API → Exposed schemas**: tambahkan `saku`
   (biarkan `public` dan schema lain tetap ada). Tanpa ini semua query mengembalikan 406.
2. **Dashboard → Authentication → URL Configuration → Redirect URLs**: tambahkan
   - `https://monli.fun/auth/callback`
   - `http://localhost:3000/auth/callback`
   - URL preview Vercel bila perlu, mis. `https://*-awahids-projects.vercel.app/auth/callback`

   Jangan ubah *Site URL* (dipakai app lain).
3. **Authentication → Providers → Google** sudah aktif di project ini. Di Google Cloud
   Console, *Authorized redirect URI* cukup
   `https://ebpppfegdesvubxqnmye.supabase.co/auth/v1/callback` (bukan URL app).
   Nama app di layar persetujuan Google mengikuti OAuth client yang sudah ada.
4. **Environment** (Vercel dan `.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://ebpppfegdesvubxqnmye.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key project awhids>
   SUPABASE_SERVICE_ROLE_KEY=<service role key project awhids>
   ```

## Migrasi
Skema ada di `supabase/migrations/20261005000000_saku_schema.sql` (gabungan semua
migrasi lama, yang kini disimpan di `supabase/migrations-legacy/` untuk sejarah saja).
Migrasi berikutnya harus menulis ke schema `saku`, mis. `create table saku.nama_tabel`.
