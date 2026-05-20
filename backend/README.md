# BINUS Marketplace — NestJS Backend

## 🗂️ Struktur Module

```
src/
├── prisma/          → PrismaModule (@Global Singleton)
├── auth/            → AuthModule  (register, login, JWT strategy)
├── users/           → UsersModule (profil, ganti password)
├── listings/        → ListingsModule (CRUD listing, stok)
├── transactions/    → TransactionsModule (beli, bayar, escrow, saldo)
├── reviews/         → ReviewsModule (review setelah transaksi)
├── chat/            → ChatModule (REST + Socket.io Gateway)
├── complaints/      → ComplaintsModule (laporan user)
├── admin/           → AdminModule (moderasi, kelola user, komisi)
├── common/
│   ├── guards/      → JwtAuthGuard, AdminGuard
│   ├── decorators/  → @CurrentUser()
│   └── filters/     → GlobalExceptionFilter
├── app.module.ts    → Root Module
└── main.ts          → Entry point
```

## ⚙️ Setup & Jalankan

### 1. Install dependencies
```bash
cd backend-nest
npm install
```

### 2. Konfigurasi .env
```bash
cp .env.example .env
# Isi DATABASE_URL dan JWT_SECRET
```

### 3. Setup database
```bash
npm run db:generate
npm run db:migrate
# Isi nama migration: init
npm run db:seed       # data contoh (opsional)
```

### 4. Jalankan server
```bash
npm run dev           # development dengan hot-reload
npm run build         # build ke dist/
npm run start         # jalankan hasil build
```

Server: `http://localhost:3000/api`

## 🔄 Perbedaan Express vs NestJS

| Konsep | Express (lama) | NestJS (baru) |
|---|---|---|
| Routing | `router.post('/register', fn)` | `@Post('register')` di controller |
| DI | Manual `new Service(new Repo())` | Otomatis via `constructor(private svc: Service)` |
| Validasi | Manual `if (!email)` | Otomatis via `class-validator` DTO |
| Auth | Middleware `authenticate` | Guard `@UseGuards(JwtAuthGuard)` |
| Socket.io | Setup manual di index.ts | `@WebSocketGateway` + `@SubscribeMessage` |
| Error handling | try/catch per controller | GlobalExceptionFilter otomatis |
| Module | Tidak ada | `@Module({ controllers, providers, imports })` |

## 🌐 API Endpoints (sama seperti Express, prefix /api)

Semua endpoint identik dengan versi Express sebelumnya.
Flutter frontend tidak perlu diubah sama sekali.
