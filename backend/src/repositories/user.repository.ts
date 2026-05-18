// src/repositories/user.repository.ts
// =============================================
// REPOSITORY PATTERN — User Repository
// =============================================
// Semua query database yang berhubungan dengan User
// ada di sini. Service TIDAK boleh sentuh Prisma langsung.
// =============================================

import { User, Role } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { UpdateProfileDto } from '../interfaces/index';

// Tipe untuk data user yang aman ditampilkan (tanpa password)
export type SafeUser = Omit<User, 'password'>;

// Tipe untuk select fields yang sering dipakai
const publicUserSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  isVerified: true,
} as const;

export class UserRepository extends BaseRepository {
  /**
   * Cari user berdasarkan email (termasuk password untuk auth)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }

  /**
   * Cari user berdasarkan ID (tanpa password)
   */
  async findById(id: string): Promise<SafeUser | null> {
    return this.db.user.findUnique({
      where: { id },
      omit: { password: true },
    });
  }

  /**
   * Cari user berdasarkan ID beserta statistiknya
   */
  async findByIdWithStats(id: string) {
    return this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        studentId: true,
        phone: true,
        bio: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            buyerTransactions: true,
            reviewsReceived: true,
          },
        },
      },
    });
  }

  /**
   * Cari profil publik user (untuk ditampilkan ke user lain)
   */
  async findPublicProfile(id: string) {
    return this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            reviewsReceived: true,
          },
        },
      },
    });
  }

  /**
   * Buat user baru
   */
  async create(data: {
    email: string;
    password: string;
    name: string;
    studentId?: string;
    role?: Role;
    isVerified?: boolean;
  }): Promise<SafeUser> {
    return this.db.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        studentId: data.studentId ?? null,
        role: data.role ?? 'STUDENT',
        isVerified: data.isVerified ?? false,
      },
      omit: { password: true },
    });
  }

  /**
   * Update profil user
   */
  async updateProfile(id: string, data: UpdateProfileDto): Promise<SafeUser> {
    return this.db.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        bio: data.bio,
      },
      omit: { password: true },
    });
  }

  /**
   * Update password user
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * Cek apakah email sudah terdaftar
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.db.user.count({ where: { email } });
    return count > 0;
  }

  /**
   * Ambil semua user (untuk admin)
   */
  async findAll(params: { keyword?: string; role?: Role; skip: number; take: number }) {
    const where: Record<string, unknown> = {};

    if (params.role) where.role = params.role;
    if (params.keyword) {
      where.OR = [
        { name: { contains: params.keyword } },
        { email: { contains: params.keyword } },
        { studentId: { contains: params.keyword } },
      ];
    }

    const [users, total] = await Promise.all([
      this.db.user.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          _count: { select: { listings: true, buyerTransactions: true } },
        },
      }),
      this.db.user.count({ where }),
    ]);

    return { users, total };
  }

  /**
   * Toggle status aktif/nonaktif user (admin)
   */
  async toggleActive(id: string): Promise<SafeUser> {
    const user = await this.db.user.findUniqueOrThrow({ where: { id } });
    return this.db.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      omit: { password: true },
    });
  }
}
