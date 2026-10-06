# Auth: login + auth layout

Scope: form login (`resources/js/pages/auth/login.tsx`) dan kerangka layout auth (`resources/js/layouts/auth/auth-simple-layout.tsx`, `resources/js/layouts/auth-layout.tsx`). Keluarga auth lain mengikuti arah ini pada sesi lanjutan.

Visitor mode: Operate. Kasir & owner membuka layar ini di laptop konter (dan owner kadang dari HP) untuk satu tujuan: masuk secepat mungkin. Bahasa UI: Bahasa Indonesia. Batas brief: "kerja serius & cepat", "ringan + satu momen". Field dan perilaku Fortify (email, sandi, remember me, lupa sandi, daftar, passkey) tidak berubah.

## Direction contract

THESIS: Layar masuk adalah slip pertama shift — formulir di atas kertas akuntansi, distempel tanggal hari ini sebelum kerja dimulai; yang ditolak adalah kartu putih melayang di atas gradien netral, default kategori login SaaS.

OWN-WORLD: Lembar bon karbon: ground krem #F3EDE0 penuh halaman, tinta #1C1A17, satu merah stempel #C2352B yang hanya berarti "aktif/terkomit" (tombol utama, fokus, stempel), biru karbon #2B4A8B untuk data sekunder; garis rambut bergaris, angka tabular monospace, label small-caps terkunci, kepadatan akuntansi dengan pemisah generous antar blok.

STORY: Pengunjung paham dalam detik pertama bahwa ini pintu masuk sistem kasir yang serius: identitas produk dan tanggal hari ini terbaca di lembar, formulir jelas sebagai pekerjaan, dan stempel merah menandai komitmen "Masuk".

FIRST VIEWPORT: Satu lembar bon full-bleed di viewport; blok identitas (nama produk placeholder + tanggal hasil stempel) di atas, formulir terkunci sebagai slip bernomor urut di tengah-kiri dengan field vertikal rapat, tombol Masuk merah selebar field, tautan "Lupa sandi?"/"Daftar" di bawah sebagai baris catatan. Tidak ada ilustrasi, tidak ada card mengambang.

FORM: "Buku Bon & Stempel" — arah grounded urutan ke-3 dari daftar kandidat, ditugaskan oleh roll; seed key 5014d809 (mode operate, scope direction), dipilih user tanpa re-roll, build path code.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Raised: full-bleed ownership (vertical feed), registration satu bingkai untuk seluruh keluarga auth (botanical folio), reserved ink merah (orienteering), committed field = lembar kertas berskala halaman (metro tiles, diterjemahkan), satu momen terkoreografi = pendaratan stempel tanggal (split-flap).
