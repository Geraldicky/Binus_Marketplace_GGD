// src/services/user.service.ts
// Business logic untuk User Profile

import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { ReviewRepository } from '../repositories/review.repository';
import { UpdateProfileDto, ChangePasswordDto } from '../interfaces/index';

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly reviewRepository: ReviewRepository,
  ) {}

  /**
   * Ambil profil publik user + rata-rata rating
   */
  async getPublicProfile(id: string) {
    const user = await this.userRepository.findPublicProfile(id);
    if (!user) throw new Error('User tidak ditemukan.');

    const aggregate = await this.reviewRepository.getAverageRating(id);

    return {
      ...user,
      avgRating: aggregate._avg.rating ?? 0,
    };
  }

  /**
   * Update profil user yang sedang login
   */
  async updateProfile(userId: string, data: UpdateProfileDto) {
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Nama tidak boleh kosong.');
    }
    return this.userRepository.updateProfile(userId, data);
  }

  /**
   * Ganti password
   * Business rules:
   * - Password lama harus benar
   * - Password baru minimal 8 karakter
   */
  async changePassword(userId: string, data: ChangePasswordDto) {
    if (data.newPassword.length < 8) {
      throw new Error('Password baru minimal 8 karakter.');
    }

    // Ambil user beserta password hash
    const user = await this.userRepository.findByEmail(
      (await this.userRepository.findById(userId))!.email,
    );
    if (!user) throw new Error('User tidak ditemukan.');

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) throw new Error('Password lama tidak sesuai.');

    const hashed = await bcrypt.hash(data.newPassword, 10);
    await this.userRepository.updatePassword(userId, hashed);
  }
}
