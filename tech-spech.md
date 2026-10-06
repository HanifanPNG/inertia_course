# TECHNICAL SPECIFICATION

## POS Restoran Sederhana

**Version:** 1.1  
**Status:** MVP  
**Platform:** Web Application  
**Target:** Restoran/cafe kecil dengan sistem pemesanan melalui kasir dan pelanggan bebas memilih tempat duduk.

---

# 1. Overview

Aplikasi ini merupakan sistem **Point of Sale (POS)** untuk membantu cafe/restoran kecil mengelola proses:

**Pemesanan → Pembayaran → Pengolahan Pesanan → Pengantaran → Selesai**

Karakteristik utama:

- Customer melakukan pemesanan melalui kasir.
- Kasir memasukkan pesanan ke sistem.
- Sistem menghasilkan **nomor pesanan**.
- Kasir memberikan nomor tersebut kepada customer.
- Customer bebas memilih tempat duduk.
- Tidak ada nomor meja yang mengikat customer.
- Waiter mencari customer berdasarkan **nomor pesanan** yang dibawa customer.
- Waiter tidak menjadi role pengguna sistem pada MVP.
- Sistem berfokus pada transaksi, menu, pengguna, dan laporan penjualan.

---

# 2. Problem Statement

Cafe menggunakan sistem tempat duduk bebas sehingga customer tidak selalu duduk di tempat yang sama.

Contoh:

Customer memesan dan mendapatkan:

> **Nomor Pesanan #125**

Customer kemudian mencari tempat duduk secara bebas.

Saat pesanan selesai dibuat, waiter harus:

> mencari customer yang membawa nomor **125**.

Karena tidak ada nomor meja, sistem tidak perlu memaksa customer menentukan lokasi duduk.

Konsep utama sistem adalah:

> **Nomor Pesanan = Identitas Pesanan dan Customer**

Sistem mencatat siapa yang membuat pesanan, apa yang dipesan, jumlah pembayaran, serta status transaksi sehingga proses pelayanan tetap terorganisir walaupun customer duduk secara bebas.

---

# 3. Goals

### Primary Goals

1. Mempercepat proses transaksi kasir.
2. Mengurangi kesalahan pencatatan pesanan.
3. Mempermudah pengelolaan menu.
4. Mempermudah pencatatan pembayaran.
5. Mendukung customer yang bebas memilih tempat duduk.
6. Membantu kasir memantau transaksi yang sedang berjalan.
7. Menyediakan laporan penjualan sederhana.

### Non-Goals

MVP tidak mencakup:

- multi-cabang
- membership/loyalty
- payroll
- CRM
- reservasi meja
- GPS customer
- delivery marketplace
- supplier management
- inventory kompleks
- integrasi payment gateway
- customer account

---

# 4. User Roles

Sistem hanya memiliki **dua role pengguna**.

## 4.1 Admin

Admin bertanggung jawab terhadap pengelolaan sistem.

### Permissions

- Login
- Melihat dashboard
- Mengelola kategori
- Mengelola menu
- Mengatur harga
- Mengaktifkan/nonaktifkan menu
- Mengelola akun kasir
- Melihat transaksi
- Melihat laporan penjualan

---

## 4.2 Kasir

Kasir merupakan pengguna utama sistem POS.

### Permissions

- Login
- Melihat menu
- Membuat pesanan
- Menambahkan item
- Mengubah quantity
- Menghapus item
- Menghitung total
- Memproses pembayaran
- Menghasilkan nomor pesanan
- Melihat detail transaksi
- Melihat pesanan aktif
- Menandai pesanan sebagai selesai
- Melihat transaksi hari berjalan

---

## 4.3 Waiter

Waiter **bukan pengguna sistem** pada MVP.

Waiter bekerja secara operasional:

- mengambil makanan yang telah selesai dibuat
- melihat nomor pesanan
- mencari customer yang membawa nomor tersebut
- mengantarkan pesanan

Tidak diperlukan akun waiter agar aplikasi tetap sederhana.

---

# 5. Customer Flow

Customer tidak membutuhkan akun.

```text
Customer datang
      ↓
Memilih menu
      ↓
Memesan ke kasir
      ↓
Kasir memasukkan pesanan
      ↓
Sistem membuat nomor pesanan
      ↓
Customer melakukan pembayaran
      ↓
Kasir memberikan nomor pesanan
      ↓
Customer duduk bebas
      ↓
Pesanan disiapkan
      ↓
Waiter mengambil pesanan
      ↓
Waiter mencari customer berdasarkan nomor
      ↓
Pesanan diberikan
      ↓
Transaksi selesai
```

---

# 6. Core Order Concept

Setiap transaksi memiliki nomor pesanan yang unik dalam satu hari.

Contoh:

```text
#001
#002
#003
...
#125
```

Nomor pesanan digunakan pada:

- struk
- tiket pesanan
- dashboard kasir
- daftar transaksi
- identifikasi customer
- proses pengantaran

Customer memegang nomor pesanan secara fisik setelah melakukan transaksi.

Contoh:

```text
┌─────────┐
│   125   │
└─────────┘
```

Customer bebas duduk di mana saja.

Waiter tidak mencari berdasarkan meja, tetapi berdasarkan nomor tersebut.

### Business Rule

Nomor pesanan harus unik berdasarkan tanggal.

Contoh:

```text
2026-10-04 → #125
2026-10-05 → #125
```

Nomor yang sama tetap diperbolehkan pada hari yang berbeda.

---

# 7. Order Status

Status pesanan dibuat sesederhana mungkin:

```text
PENDING
   ↓
PAID
   ↓
COMPLETED
```

### PENDING

Pesanan sudah dibuat tetapi belum selesai dibayar.

### PAID

Pembayaran telah berhasil.

Pada status ini, pesanan masuk ke proses operasional restoran untuk disiapkan.

Sistem **tidak mencatat status dapur secara terpisah** pada MVP.

### COMPLETED

Pesanan telah selesai diberikan kepada customer.

Status `COMPLETED` dapat diperbarui oleh kasir setelah mendapatkan konfirmasi bahwa pesanan telah diberikan kepada customer.

### Cancelled

Pembatalan transaksi dapat ditangani melalui aksi khusus **Cancel Order**, bukan sebagai status utama order.

---

# 8. Functional Requirements

## 8.1 Authentication

Sistem menyediakan login untuk:

- Admin
- Kasir

### Field

```text
name/email
password
role
```

Authorization:

```text
Admin  → Admin Dashboard
Kasir  → Cashier Dashboard
```

Admin dapat mengakses seluruh fitur administrasi, sedangkan kasir hanya dapat mengakses fitur yang berkaitan dengan transaksi.

---

# 9. Menu Management

Admin dapat mengelola seluruh menu cafe.

Menu dibagi berdasarkan kategori.

### Contoh kategori

```text
Mie
Chicken
Minuman
Snack
```

Kategori dapat dikembangkan menjadi:

```text
Mie
Chicken Bowl
Chicken Rice
Minuman
Snack
Dessert
```

### Product fields

```text
id
category_id
name
description
price
image
is_active
created_at
updated_at
```

### Contoh menu

```text
Mie
├── Mie Ayam
├── Mie Chili
└── Mie Sambal

Chicken
├── Chicken Bowl
├── Chicken Rice
└── Crispy Chicken

Minuman
├── Es Teh
├── Lemon Tea
└── Coffee

Snack
├── French Fries
├── Nugget
└── Dimsum
```

Menu dengan:

```text
is_available = false
```

tidak dapat dipilih dalam transaksi.

---

# 10. Category Management

Admin dapat:

- menambahkan kategori
- mengubah kategori
- menghapus kategori
- melihat daftar kategori

### Fields

```text
id
name
created_at
updated_at
```

---

# 11. Create Order

Kasir membuat pesanan melalui POS.

Contoh tampilan:

```text
┌─────────────────────────────────────┐
│ MENU                                │
├─────────────────────────────────────┤
│ MIE                                 │
│ Mie Ayam        Rp15.000    [+]     │
│ Mie Chili       Rp17.000    [+]     │
│                                     │
│ CHICKEN                             │
│ Chicken Bowl   Rp22.000    [+]     │
│ Crispy Chicken Rp20.000    [+]     │
│                                     │
│ MINUMAN                             │
│ Es Teh            Rp5.000    [+]    │
│ Coffee           Rp15.000    [+]    │
│                                     │
│ SNACK                               │
│ French Fries      Rp12.000   [+]    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ CURRENT ORDER                        │
├─────────────────────────────────────┤
│ Mie Chili        x2     Rp34.000     │
│ Chicken Bowl     x1     Rp22.000     │
│ Es Teh           x2     Rp10.000     │
├─────────────────────────────────────┤
│ TOTAL                    Rp66.000    │
│                                     │
│ [ BAYAR ]                           │
└─────────────────────────────────────┘
```

---

# 12. Payment

Setelah pesanan dibuat, kasir memproses pembayaran.

### Payment Methods

```text
CASH
QRIS
DEBIT
```

Pada MVP, metode QRIS dan debit cukup dicatat sebagai metode pembayaran tanpa integrasi payment gateway.

### Payment fields

```text
id
order_id
method
amount
paid_at
created_at
```

---

# 13. Generate Order Number

Sistem membuat nomor pesanan ketika order berhasil dibuat.

Contoh:

```text
ORDER #125
```

Nomor tersebut ditampilkan pada:

- layar transaksi
- struk
- tiket pesanan

Kasir memberikan nomor pesanan kepada customer secara fisik.

---

# 14. Receipt / Order Ticket

Bukti transaksi minimal berisi:

```text
================================
          NAMA CAFE
================================

ORDER #125

Mie Chili        x2   34.000
Chicken Bowl     x1   22.000
Es Teh           x2   10.000
--------------------------------
TOTAL                 66.000

PAYMENT               QRIS

Terima kasih!
================================
```

Nomor pesanan harus terlihat jelas karena digunakan customer untuk proses pengantaran.

---

# 15. Order Monitoring

Kasir dapat melihat transaksi yang sedang berjalan.

Contoh:

```text
ACTIVE ORDERS

#123   PENDING
#124   PAID
#125   PAID
#126   COMPLETED
```

Filter:

```text
All
Pending
Paid
Completed
```

Pesanan dengan status `PAID` merupakan pesanan yang sedang diproses oleh operasional cafe.

---

# 16. Order Delivery Concept

Karena cafe tidak menggunakan nomor meja, pengantaran dilakukan berdasarkan nomor pesanan.

Contoh:

```text
Order #125
       ↓
Customer menerima nomor 125
       ↓
Customer duduk bebas
       ↓
Pesanan selesai disiapkan
       ↓
Waiter mengambil pesanan #125
       ↓
Waiter mencari customer
yang membawa nomor 125
       ↓
Pesanan diberikan
       ↓
Kasir menandai #125 sebagai COMPLETED
```

Dengan demikian sistem tidak membutuhkan:

- nomor meja
- denah meja
- lokasi customer
- akun waiter

---

# 17. Dashboard Admin

Dashboard menampilkan informasi penting secara ringkas.

```text
TODAY

Revenue
Rp2.450.000

Transactions
83

Items Sold
214

Best Seller
Mie Chili

Paid Orders
12
```

---

# 18. Sales Report

Admin dapat melihat laporan penjualan berdasarkan periode.

### Daily

```text
Tanggal
Jumlah transaksi
Total pendapatan
```

### Monthly

```text
Jumlah transaksi
Total pendapatan
Menu terlaris
Metode pembayaran
```

Contoh:

```text
Sales Report — October 2026

Transactions     2.345
Revenue          Rp72.450.000

Cash             Rp30.000.000
QRIS             Rp35.000.000
Debit             Rp7.450.000
```

---

# 19. Database Design

Database minimum:

```text
users
categories
menus
orders
order_items
payments
```

---

## 19.1 users

```text
users
-------------------------
id
name
email
password
role
created_at
updated_at
```

Role:

```text
admin
cashier
```

---

## 19.2 categories

```text
categories
-------------------------
id
name
created_at
updated_at
```

Relationship:

```text
Category hasMany Menu
```

---

## 19.3 menus

```text
menus
-------------------------
id
category_id
name
description
price
image
is_available
created_at
updated_at
```

Relationship:

```text
Menu belongsTo Category
Menu hasMany OrderItem
```

---

## 19.4 orders

```text
orders
-------------------------
id
order_number
order_date
user_id
total_amount
status
created_at
updated_at
```

`user_id` menunjukkan kasir yang membuat order.

Contoh:

```text
id           = 1001
order_number = 125
order_date   = 2026-10-04
user_id      = 3
total_amount = 66000
status       = paid
```

### Unique Constraint

```text
UNIQUE(order_date, order_number)
```

---

## 19.5 order_items

```text
order_items
-------------------------
id
order_id
menu_id
quantity
price
subtotal
created_at
updated_at
```

Harga transaksi disimpan pada `order_items` agar histori transaksi tetap benar ketika harga menu berubah.

Contoh:

```text
menu_id   = 12
quantity  = 2
price     = 17000
subtotal  = 34000
```

---

## 19.6 payments

```text
payments
-------------------------
id
order_id
method
amount
paid_at
created_at
updated_at
```

---

# 20. Relationships

```text
User
 │
 └── hasMany Orders


Category
 │
 └── hasMany Menus


Menu
 │
 └── hasMany OrderItems


Order
 ├── belongsTo User
 ├── hasMany OrderItems
 └── hasOne Payment


OrderItem
 ├── belongsTo Order
 └── belongsTo Menu


Payment
 └── belongsTo Order
```

Visual:

```text
USERS
  │
  │ 1:N
  ↓
ORDERS
  │
  ├──────── 1:N ────────→ ORDER_ITEMS ←──── N:1 ──── MENUS
  │
  │ 1:1
  ↓
PAYMENTS

CATEGORIES
     │
     │ 1:N
     ↓
   MENUS
```

---

# 21. Application Architecture

Aplikasi menggunakan pola:

```text
React
   ↓
Inertia.js
   ↓
Laravel
   ↓
Eloquent ORM
   ↓
MySQL
```

Tidak diperlukan API terpisah untuk kebutuhan utama aplikasi.

Contoh alur:

```text
Kasir memilih menu
      ↓
React POS Interface
      ↓
Inertia Request
      ↓
Laravel Controller
      ↓
Order Service / Business Logic
      ↓
Eloquent Model
      ↓
MySQL
```

---

# 22. Main Routes

### Authentication

```text
/login
/logout
```

### Admin

```text
/admin/dashboard
/admin/categories
/admin/menus
/admin/users
/admin/reports
```

### Cashier

```text
/cashier/dashboard
/cashier/orders/create
/cashier/orders
/cashier/orders/{id}
/cashier/orders/{id}/payment
```

### Order Display

```text
/orders/display
```

Halaman display dapat digunakan untuk menampilkan nomor pesanan kepada customer/staff.

---

# 23. API Requirement

API terpisah **tidak diperlukan untuk MVP**.

Laravel menangani backend dan Inertia mengirimkan data ke halaman React.

API dapat dipertimbangkan di masa depan apabila:

- dibuat aplikasi mobile
- dibuat aplikasi khusus waiter
- dibuat aplikasi customer self-order
- sistem membutuhkan client eksternal

---

# 24. Realtime Order

Realtime tidak menjadi kebutuhan wajib pada MVP.

Implementasi awal dapat menggunakan refresh/polling sederhana untuk halaman monitoring.

Contoh:

```text
Setiap 5 detik
        ↓
Request order terbaru
        ↓
Update daftar order
```

Realtime WebSocket dapat ditambahkan pada tahap pengembangan berikutnya.

---

# 25. Validation Rules

### Menu

```text
name        required
category_id required
price       required|numeric|min:0
```

### Order

```text
items       required
quantity    required|integer|min:1
```

### Payment

```text
method      required
amount      required|numeric|min:0
```

### Order Number

Harus unik berdasarkan tanggal transaksi.

---

# 26. Security

Minimal security:

- password menggunakan hashing
- authentication
- authorization berdasarkan role
- CSRF protection
- server-side validation
- database transaction
- admin-only routes
- kasir hanya dapat mengakses fitur transaksi

Contoh middleware:

```text
auth
role:admin
role:cashier
```

---

# 27. Transaction Integrity

Proses pembayaran menggunakan database transaction.

```text
BEGIN TRANSACTION

Create Order
Create Order Items
Create Payment
Update Order Status → PAID

COMMIT
```

Jika proses gagal:

```text
ROLLBACK
```

Hal ini mencegah data order tersimpan tanpa pembayaran atau sebaliknya.

---

# 28. MVP Scope

## Admin

- Login
- Dashboard
- CRUD kategori
- CRUD menu
- Mengelola kasir
- Melihat transaksi
- Laporan penjualan

## Kasir

- Login
- Membuat order
- Melihat menu berdasarkan kategori
- Mengelola cart
- Checkout
- Pembayaran
- Generate nomor pesanan
- Melihat struk
- Monitoring order
- Menandai order sebagai completed

## Customer

- Tidak perlu login
- Melakukan pemesanan melalui kasir
- Menerima nomor pesanan
- Duduk bebas
- Menunggu pesanan
- Menunjukkan nomor pesanan saat makanan diantar

## Waiter

- Tidak memiliki akun
- Mengambil pesanan yang telah selesai dibuat
- Mencari customer berdasarkan nomor pesanan
- Mengantarkan pesanan

---

# 29. Example End-to-End Scenario

Customer memesan:

```text
Mie Chili x2
Chicken Bowl x1
Es Teh x2
```

Kasir memasukkan pesanan.

Sistem menghasilkan:

```text
ORDER #125
TOTAL Rp66.000
```

Customer membayar menggunakan QRIS.

Status:

```text
PAID
```

Kasir memberikan:

```text
┌─────────┐
│   125   │
└─────────┘
```

Customer kemudian duduk bebas.

Pesanan disiapkan oleh pihak cafe.

Ketika makanan selesai, waiter mengambil order dengan nomor:

```text
#125
```

Waiter mencari customer yang membawa nomor **125**.

Setelah customer ditemukan, pesanan diberikan.

Kasir kemudian memperbarui status:

```text
COMPLETED
```

Transaksi masuk ke laporan penjualan.

---

# 30. Success Criteria

MVP dianggap berhasil apabila:

1. Admin dapat mengelola kategori dan menu.
2. Kasir dapat membuat transaksi.
3. Sistem menghasilkan nomor pesanan unik.
4. Customer mendapatkan nomor pesanan setelah membayar.
5. Customer dapat duduk bebas tanpa nomor meja.
6. Sistem menyimpan detail item dan pembayaran.
7. Kasir dapat melihat order berstatus `PENDING`, `PAID`, dan `COMPLETED`.
8. Kasir dapat menandai transaksi sebagai selesai setelah pesanan diterima customer.
9. Admin dapat melihat laporan penjualan.
10. Nomor pesanan dapat digunakan waiter untuk menemukan customer.

---

# 31. Future Development

Setelah MVP selesai, sistem dapat dikembangkan menjadi:

```text
v2
├── Kitchen Display
├── Realtime Order
├── QRIS Payment Gateway
├── Cetak Struk Thermal
├── Stock Management
└── Discount & Promotion

v3
├── Customer Self Ordering
├── QR Code Menu
├── Aplikasi Waiter
├── Multi Branch
└── Sales Analytics
```

---

# 32. Core Design Principle

Sistem dirancang untuk restoran/cafe kecil sehingga alurnya tidak dibuat terlalu kompleks.

```text
SIMPLE POS
    +
FREE SEATING
    +
CLEAR ORDER NUMBER
    +
EASY TRANSACTION
```

Konsep utama:

> **Customer bebas duduk di mana saja, sedangkan nomor pesanan menjadi identitas utama untuk menghubungkan transaksi dengan customer.**

Dengan pendekatan ini, restoran tidak membutuhkan nomor meja atau sistem lokasi customer yang kompleks.