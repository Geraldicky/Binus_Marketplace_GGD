// src/services/auth.service.ts
// =============================================
// SERVICE LAYER PATTERN — Auth Service
// =============================================
// Business logic untuk autentikasi.
// Controller memanggil Service, Service memanggil Repository.
// Controller TIDAK boleh langsung panggil Repository.
// =============================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { RegisterDto, LoginDto, AuthResponse, JwtPayload } from '../interfaces/auth.interface';

export class AuthService {
  // Dependency Injection: UserRepository di-inject melalui constructor
  // Ini adalah penerapan Dependency Injection sederhana tanpa framework
  constructor(private readonly userRepository: UserRepository) {}

  // ─────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────

  private generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET tidak dikonfigurasi');

    return jwt.sign({ userId } as JwtPayload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    } as jwt.SignOptions);
  }

  /**
   * Mock SSO: Verifikasi email domain BINUS.
   * Di aplikasi nyata, ini memanggil API SSO BINUS.
   * Membaca domain dari env SSO_ALLOWED_DOMAINS.
   */
  private verifySSODomain(email: string): boolean {
    const raw = process.env.SSO_ALLOWED_DOMAINS ?? '@binus.ac.id,@student.binus.ac.id,@binus.edu';
    const allowedDomains = raw.split(',').map((d) => d.trim());
    return allowedDomains.some((domain) => email.endsWith(domain));
  }

  // ─────────────────────────────────────────────
  // Public methods (Business Logic)
  // ─────────────────────────────────────────────

  /**
   * Registrasi user baru
   * Business rules:
   * - Email harus domain BINUS (mock SSO)
   * - Email tidak boleh sudah terdaftar
   * - Password minimal 8 karakter
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    // Rule 1: Verifikasi SSO domain
    if (!this.verifySSODomain(data.email)) {
      throw new Error('Email harus menggunakan domain BINUS (@binus.ac.id atau @student.binus.ac.id).');
    }

    // Rule 2: Email belum terdaftar
    const emailExists = await this.userRepository.existsByEmail(data.email);
    if (emailExists) {
      throw new Error('Email sudah terdaftar.');
    }

    // Rule 3: Password minimal 8 karakter
    if (data.password.length < 8) {
      throw new Error('Password minimal 8 karakter.');
    }

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Simpan ke database via repository
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      studentId: data.studentId,
      isVerified: true, // Mock SSO: langsung verified
    });

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        studentId: user.studentId,
        phone: user.phone,
        bio: user.bio,
        role: user.role,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }

  /**
   * Login user
   * Business rules:
   * - User harus ada
   * - Akun harus aktif
   * - Password harus cocok
   * - Domain email harus BINUS (re-verify saat login)
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    // Ambil user beserta password (untuk verifikasi)
    const user = await this.userRepository.findByEmail(data.email);

    // Rule: User harus ada (pesan error dibuat sama untuk keamanan)
    if (!user) {
      throw new Error('Email atau password salah.');
    }

    // Rule: Akun harus aktif
    if (!user.isActive) {
      throw new Error('Akun Anda telah dinonaktifkan. Hubungi admin.');
    }

    // Rule: Password harus cocok
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email atau password salah.');
    }

    // Rule: Re-verify SSO domain
    if (!this.verifySSODomain(user.email)) {
      throw new Error('Verifikasi SSO BINUS gagal.');
    }

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        studentId: user.studentId,
        phone: user.phone,
        bio: user.bio,
        role: user.role,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }

  /**
   * Ambil data user yang sedang login
   */
  async getMe(userId: string) {
    const user = await this.userRepository.findByIdWithStats(userId);
    if (!user) throw new Error('User tidak ditemukan.');
    return user;
  }
}
