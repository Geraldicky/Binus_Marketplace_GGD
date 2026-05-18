// src/repositories/base.repository.ts
// =============================================
// REPOSITORY PATTERN — Base Repository
// =============================================
//
// Ini adalah "abstract class" yang menjadi fondasi
// semua repository lainnya. Berisi operasi CRUD dasar
// yang bisa digunakan ulang oleh semua repository.
//
// Kenapa abstract class, bukan interface?
//   → Karena kita ingin menyediakan implementasi default
//     yang bisa dipakai langsung oleh child class,
//     bukan hanya kontrak kosong.
//
// Kenapa Generic <T>?
//   → Supaya BaseRepository bisa dipakai untuk model apapun
//     (User, Listing, Transaction, dll) tanpa duplikasi kode.
// =============================================

import prisma from '../lib/prisma';
import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository {
  // Semua repository anak mendapat akses ke prisma client
  // yang sama (Singleton)
  protected readonly db: PrismaClient;

  constructor() {
    this.db = prisma;
  }
}
