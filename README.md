# monli 💰
> Aplikasi pencatatan keuangan pribadi — sederhana, cepat, tanpa server.

## Tentang

**monli** adalah aplikasi web ringan untuk mencatat pengeluaran dan tabungan bulanan sesuai pos yang sudah ditentukan. Semua data disimpan di browser (localStorage) — tidak butuh akun, tidak butuh internet setelah dibuka pertama kali.

## Fitur

- 📊 **Dashboard bulanan** — ringkasan gaji, pengeluaran, tabungan, dan sisa
- 📁 **11 pos anggaran** — pengeluaran rutin & tabungan/investasi
- ✅ **Progress bar per kategori** — langsung tahu mana yang hampir habis
- 📝 **Catat transaksi** — pilih kategori, nominal, tanggal, dan catatan
- 🗓️ **Navigasi bulan** — lihat histori bulan sebelumnya
- 🔴 **Alert over-budget** — pos yang melebihi anggaran langsung berwarna merah
- 📱 **Mobile friendly** — cocok dipakai di HP

## Anggaran Default

| Pos | Budget/bulan |
|-----|-------------|
| Uang Istri | Rp 2.000.000 |
| Kontrakan & Listrik | Rp 2.000.000 |
| SPP | Rp 600.000 |
| Ojek Harian | Rp 900.000 |
| Transport CI–BDG | Rp 1.200.000 |
| Makan & Harian | Rp 800.000 |
| Dana Darurat | Rp 800.000 |
| Liburan (3 bulanan) | Rp 500.000 |
| Mudik Maret (Sumbawa) | Rp 1.200.000 |
| Investasi Saham | Rp 300.000 |
| Cadangan Tak Terduga | Rp 700.000 |
| **Total** | **Rp 11.000.000** |

## Cara Pakai

### Buka Langsung di Browser
```
Buka file index.html di browser — tidak butuh server.
```

### Jalankan via Live Server (VS Code)
1. Install ekstensi **Live Server** di VS Code
2. Klik kanan `index.html` → **Open with Live Server**

### Deploy ke GitHub Pages
1. Push repo ini ke GitHub
2. Masuk ke **Settings → Pages**
3. Source: `main` branch, folder `/` (root)
4. Akses di `https://awahids.github.io/monli`

## Struktur Folder

```
monli/
├── index.html          # Halaman utama
├── css/
│   └── style.css       # Semua styling
├── js/
│   └── app.js          # Logic aplikasi + data kategori
└── README.md
```

## Kustomisasi Budget

Edit bagian `CATEGORIES` dan `GAJI` di `js/app.js`:

```js
const GAJI = 11_000_000; // Ganti sesuai gaji

// Ubah budget per kategori:
{ id: 'istri', name: 'Uang Istri', budget: 2_000_000, ... }
```

## Data & Privasi

Semua data tersimpan di **localStorage browser** kamu — tidak dikirim ke mana pun. Jika ganti browser atau bersihkan cache, data akan hilang. Untuk backup, ekspor data lewat DevTools → Application → localStorage.

---

Dibuat dengan ❤️ untuk manajemen keuangan pribadi.
