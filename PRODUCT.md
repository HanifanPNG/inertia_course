# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Kasir (persona Rina)** — kasir restoran usia ~22, level teknis pemula–menengah; bekerja di konter saat peak hour, butuh input cepat dan kalkulasi kembalian akurat.
- **Owner (persona Pak Budi)** — pemilik restoran kecil, teknis pemula; memantau omset, stok, dan selisih kas dari satu tempat.

Role pada sistem: `admin` (owner) dan `cashier` (kasir), keduanya masuk lewat layar login yang sama.

## Product Purpose

POS restoran untuk menggantikan pencatatan manual: transaksi cepat (order → bayar → struk), stok ter-update otomatis, shift kasir tercatat, dan laporan siap baca untuk owner. Sukses = kesalahan input/hitungan turun drastis vs manual, rekap tanpa hitung tangan, dan selisih kas ketahuan lebih awal.

## Positioning

Sederhana & cepat untuk kasir pemula: minim klik, dirancang untuk jam sibuk; terintegrasi stok + shift kasir akuntabel + laporan tepat waktu. Skala restoran kecil–menengah (1–3 kasir, < 10k transaksi/bulan), bukan enterprise.

## Operating Context

- Dibuka lewat browser di laptop/PC kasir (target utama desktop; tablet opsional), bisa lokal/LAN.
- Layar login adalah titik masuk dua peran: kasir memulai shift di konter, owner masuk untuk master data & laporan.
- Pemakaian nyata berbahasa Indonesia (PRD: NFR Usability — "Bahasa Indonesia").
- Dokumen kebenaran produk: `.agents/1-PRD.md`, `.agents/3-TASKS.md`.

## Capabilities and Constraints

- Stack: Laravel 13 / PHP 8.3, Inertia v3 + React 19 + TypeScript, Tailwind 4 + shadcn/ui, Wayfinder, Fortify, Pest; SQLite (dev/test), timezone Asia/Jakarta.
- Autentikasi Fortify: login email+password, remember me, lupa password, registrasi, passkey (komponen `PasskeyVerify` sudah ada di halaman login).
- UI copy: **Bahasa Indonesia** (diputuskan user; kode starter kit sebelumnya Inggris).
- Bahasa/framework tidak boleh diubah; komponen `resources/js/components/ui/*` dipakai ulang.
- Masih berjalan: `.agents/3-TASKS.md` adalah task master; perubahan wajib lolos `pint`, `phpstan`, `pest`, `types:check`, `npm run build`.

## Brand Commitments

- Nama tampilan di layar auth **belum diputuskan** — user akan mengisinya sendiri; sementara didesain pakai placeholder yang mudah diganti. Jangan mengarang nama restoran/produk.
- Tidak ada logo/aset brand yang dikunci; `APP_NAME` saat ini `pos-app`.
- Scope perubahan yang diizinkan: **form login + kerangka layout auth**; keluarga auth lain (register, forgot/reset password) akan mengikuti arah yang sama pada sesi lanjutan.

## Evidence on Hand

- PRD lengkap: `.agents/1-PRD.md` (visi, 2 persona, user stories, FR-01…FR-15, NFR).
- Task master terisi T-01…T-16: `.agents/3-TASKS.md`.
- Kode berjalan: halaman `resources/js/pages/auth/login.tsx`, layout `resources/js/layouts/auth/auth-simple-layout.tsx`.
- Aset: `public/images/qris.png` (placeholder QRIS), `tests/Fixtures/product.png` (fixture gambar produk).
- Absen yang tidak boleh dikarang: nama brand restoran, logo, testimoni pelanggan, harga, klaim komersial.

## Product Principles

1. Kecepatan dan minim klik di atas kerumitan fitur; peak hour adalah ujung tesnya.
2. Angka harus bisa dipertanggungjawabkan: setiap transaksi, shift, dan stok saling terkait.
3. Bisa dipakai kasir pemula tanpa pelatihan panjang (UI simpel, feedback jelas).
4. Ikuti konvensi dan komponen yang sudah ada di project; jangan menambah dependensi baru.
5. Jangan mengarang fakta (nama, klaim, data) yang tidak ada di PRD atau kode.

## Accessibility & Inclusion

Belum ada standar aksesibilitas produk yang ditetapkan; pekerjaan apa pun harus tetap mempertahankan praktik dasar: label form eksplisit, urutan fokus keyboard, kontras terbaca, dan dukungan `prefers-reduced-motion`.
