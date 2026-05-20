# BINUS Student Marketplace

Aplikasi marketplace khusus mahasiswa BINUS untuk jual beli barang & jasa.

---

## 🗂️ Struktur Proyek

```
binus-marketplace/
├── backend-ts/     → Express.js + TypeScript + Prisma + Socket.io
└── frontend/       → Flutter (Dart)
```

---

## ⚙️ Setup Backend

### 1. Install & Jalankan XAMPP
Download dari: https://www.apachefriends.org/
- Buka **XAMPP Control Panel**
- Klik **Start** pada baris **Apache** dan **MySQL**
- Buka browser → `http://localhost/phpmyadmin`
- Di sidebar kiri klik **"New"** → isi nama database: `binus_marketplace` → klik **"Create"**

### 2. Install dependensi
```bash
cd backend-ts
npm install
```

### 3. Konfigurasi environment
```bash
cp .env.example .env
```
Buka file `.env`, bagian `DATABASE_URL` sudah diisi untuk XAMPP default:
```
DATABASE_URL="mysql://root:@localhost:3306/binus_marketplace"
```
> Jika XAMPP MySQL kamu punya password, ubah menjadi:
> `mysql://root:PASSWORDMU@localhost:3306/binus_marketplace`

Isi juga `JWT_SECRET` dengan string acak panjang:
```
JWT_SECRET="isi_dengan_string_acak_minimal_32_karakter"
```

### 4. Generate Prisma client & migrate database
```bash
npm run db:generate
npm run db:migrate
```
Saat diminta nama migration, ketik misalnya: `init`

Setelah berhasil, cek di **phpMyAdmin** — tabel-tabel akan otomatis terbuat di database `binus_marketplace`.

### 5. Seed data awal (opsional, untuk testing)
```bash
npm run db:seed
```
Ini akan membuat akun:
| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@binus.ac.id      | password123 |
| Student | alice@binus.ac.id      | password123 |
| Student | bob@binus.ac.id        | password123 |

### 6. Jalankan server
```bash
npm run dev
```
Server berjalan di: `http://localhost:3000`
Health check: `http://localhost:3000/api/health`

---

## 📱 Setup Frontend (Flutter)

### 1. Install Flutter
Download dari: https://flutter.dev/docs/get-started/install

### 2. Install dependensi
```bash
cd frontend
flutter pub get
```

### 3. Sesuaikan URL backend
Buka `lib/services/api_service.dart` dan ubah `baseUrl`:
```dart
// Android Emulator → gunakan 10.0.2.2
static const String baseUrl = 'http://10.0.2.2:3000/api';

// iOS Simulator → gunakan localhost
static const String baseUrl = 'http://localhost:3000/api';

// Device fisik → gunakan IP komputer kamu
// Cek IP dengan: ipconfig (Windows) / ifconfig (Mac/Linux)
static const String baseUrl = 'http://192.168.x.x:3000/api';
```

Ubah juga URL Socket.io di `lib/screens/student/chat_room_screen.dart`:
```dart
const socketUrl = 'http://10.0.2.2:3000'; // sesuaikan
```

### 4. Jalankan aplikasi
```bash
flutter run
```

---

## 🔌 API Endpoints Lengkap

### Auth
| Method | Endpoint          | Deskripsi         | Auth |
|--------|-------------------|-------------------|------|
| POST   | /api/auth/register | Daftar akun baru  | ❌   |
| POST   | /api/auth/login   | Login             | ❌   |
| GET    | /api/auth/me      | Data user aktif   | ✅   |

### Listings
| Method | Endpoint                   | Deskripsi              | Auth |
|--------|----------------------------|------------------------|------|
| GET    | /api/listings              | Browse listing aktif   | ✅   |
| GET    | /api/listings/my/listings  | Listing milik saya     | ✅   |
| GET    | /api/listings/:id          | Detail listing         | ✅   |
| POST   | /api/listings              | Tambah listing baru    | ✅   |
| PUT    | /api/listings/:id          | Edit listing           | ✅   |
| DELETE | /api/listings/:id          | Hapus listing          | ✅   |

### Transactions
| Method | Endpoint                        | Deskripsi           | Auth |
|--------|---------------------------------|---------------------|------|
| GET    | /api/transactions               | Transaksi saya      | ✅   |
| GET    | /api/transactions/:id           | Detail transaksi    | ✅   |
| POST   | /api/transactions               | Buat transaksi      | ✅   |
| PATCH  | /api/transactions/:id/status    | Update status       | ✅   |

### Reviews
| Method | Endpoint                  | Deskripsi            | Auth |
|--------|---------------------------|----------------------|------|
| POST   | /api/reviews              | Buat review          | ✅   |
| GET    | /api/reviews/user/:userId | Review user tertentu | ✅   |

### Chat
| Method | Endpoint                           | Deskripsi          | Auth |
|--------|------------------------------------|--------------------|------|
| GET    | /api/chat/rooms                    | Daftar chat rooms  | ✅   |
| POST   | /api/chat/rooms                    | Buka/buat chat     | ✅   |
| GET    | /api/chat/rooms/:roomId/messages   | Pesan dalam room   | ✅   |

### Admin
| Method | Endpoint                         | Deskripsi            | Auth  |
|--------|----------------------------------|----------------------|-------|
| GET    | /api/admin/dashboard             | Statistik dashboard  | Admin |
| GET    | /api/admin/listings/pending      | Listing pending      | Admin |
| PATCH  | /api/admin/listings/:id/moderate | Approve/Reject       | Admin |
| GET    | /api/admin/users                 | Semua users          | Admin |
| PATCH  | /api/admin/users/:id/toggle      | Aktif/nonaktif user  | Admin |

### Complaints
| Method | Endpoint             | Deskripsi           | Auth  |
|--------|----------------------|---------------------|-------|
| POST   | /api/complaints      | Buat pengaduan      | ✅    |
| GET    | /api/complaints      | Lihat pengaduan     | Admin |
| PATCH  | /api/complaints/:id  | Update status       | Admin |

---

## 🔴 Socket.io Events (Real-time Chat)

### Client → Server
| Event          | Payload                           | Deskripsi             |
|----------------|-----------------------------------|-----------------------|
| `join_room`    | `roomId: string`                  | Masuk ke chat room    |
| `leave_room`   | `roomId: string`                  | Keluar dari chat room |
| `send_message` | `{ roomId, content }`             | Kirim pesan           |
| `typing`       | `{ roomId, isTyping: boolean }`   | Indikator mengetik    |

### Server → Client
| Event          | Payload                           | Deskripsi             |
|----------------|-----------------------------------|-----------------------|
| `new_message`  | `MessageModel`                    | Pesan baru masuk      |
| `user_typing`  | `{ userId, name, isTyping }`      | User lain mengetik    |
| `error`        | `{ message: string }`             | Error dari server     |

---

## 🏗️ Alur Use Case

```
1. Register / Login  →  SSO mock (verifikasi domain @binus.ac.id)
2. Browse Listing    →  Filter kategori, tipe (produk/jasa), pencarian
3. Manage Listings   →  Tambah → Pending → Admin approve → Active
4. Transaksi         →  Buyer request → Seller confirm → Completed
5. Review            →  Hanya setelah transaksi Completed
6. Chat              →  Real-time antar buyer-seller via Socket.io
7. Admin Moderasi    →  Approve/Reject listing pending
8. Admin Kelola User →  Aktif/nonaktif user
9. Admin Pengaduan   →  Terima, tinjau, selesaikan complaint
```

---

## 🚨 Catatan Penting untuk Development

1. **Jangan commit file `.env`** — sudah ada di `.gitignore`
2. **Images**: Untuk prototype, field `images` disimpan sebagai JSON string kosong `"[]"`. Implementasi upload file perlu ditambahkan terpisah menggunakan `multer` di backend.
3. **Database**: Setiap kali mengubah `schema.prisma`, jalankan `npm run db:migrate` lagi.
