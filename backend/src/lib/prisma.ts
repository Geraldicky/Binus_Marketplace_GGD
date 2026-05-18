// src/lib/prisma.ts
// =============================================
// SINGLETON PATTERN — Prisma Client
// =============================================
//
// Masalah tanpa Singleton:
//   Setiap file yang menulis "new PrismaClient()" akan membuat
//   koneksi database baru → boros resource → bisa melebihi
//   batas koneksi MySQL.
//
// Solusi Singleton:
//   Hanya ada SATU instance PrismaClient di seluruh aplikasi.
//   Semua repository menggunakan instance yang sama.
//
// Cara kerja:
//   1. Pertama kali dipanggil → instance dibuat, disimpan di globalThis
//   2. Pemanggilan berikutnya → instance yang sama dikembalikan
//   3. Di development (hot-reload) → cek globalThis agar tidak buat baru
// =============================================

import { PrismaClient } from '@prisma/client';

// Deklarasi global untuk menyimpan instance saat development (hot-reload)
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

class PrismaService {
  private static instance: PrismaClient;

  // Private constructor mencegah pembuatan instance dari luar
  private constructor() {}

  /**
   * Mengembalikan satu-satunya instance PrismaClient.
   * Jika belum ada, buat baru. Jika sudah ada, kembalikan yang lama.
   */
  public static getInstance(): PrismaClient {
    // Di production: buat instance sekali saja
    if (process.env.NODE_ENV === 'production') {
      if (!PrismaService.instance) {
        PrismaService.instance = new PrismaClient({
          log: ['error', 'warn'],
        });
      }
      return PrismaService.instance;
    }

    // Di development: simpan di globalThis agar tidak buat baru saat hot-reload
    if (!global.__prisma) {
      global.__prisma = new PrismaClient({
        log: ['query', 'error', 'warn'],
      });
    }
    return global.__prisma;
  }
}

// Export satu instance yang siap dipakai
const prisma = PrismaService.getInstance();

export default prisma;
