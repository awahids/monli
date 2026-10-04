# Rencana Spesifikasi Fitur (RSL)

Dokumen ini mendeskripsikan kebutuhan fungsional utama untuk aplikasi Qala Saku (sebelumnya monli).

## Manajemen Profil
- Pengguna dapat membuat dan menyimpan profil dengan email unik, nama, dan mata uang default.
- Sistem mencatat waktu pembuatan dan pembaruan profil.

## Akun
- Pengguna dapat membuat beberapa akun dengan tipe `bank`, `ewallet`, atau `cash`.
- Setiap akun menyimpan mata uang, saldo awal, status arsip, serta waktu pembuatan dan pembaruan.

## Kategori
- Pengguna dapat mendefinisikan kategori `expense` dan `income` dengan warna dan ikon.
- Kategori digunakan untuk mengelompokkan transaksi dan item anggaran.

## Anggaran
- Pengguna dapat membuat anggaran bulanan yang terkait dengan akun.
- Anggaran menyimpan total nominal dan memiliki relasi ke beberapa item anggaran.

## Item Anggaran
- Setiap item anggaran menunjuk ke kategori dan nominal yang dialokasikan.
- Item dapat ditandai sebagai `rollover` untuk mengakumulasi sisa anggaran.

## Transaksi
- Pengguna dapat mencatat transaksi bertipe `expense`, `income`, atau `transfer`.
- Transaksi terkait dengan akun, kategori, nominal, tanggal, catatan, dan tag.
