// src/auth/auth.service.ts

import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ── Private helpers ──────────────────────

  private verifySSODomain(email: string): boolean {
    const raw = process.env.SSO_ALLOWED_DOMAINS ?? '@binus.ac.id,@student.binus.ac.id,@binus.edu';
    return raw.split(',').map(d => d.trim()).some(domain => email.endsWith(domain));
  }

  private generateToken(userId: string): string {
    return this.jwtService.sign({ userId });
  }

  // ── Public methods ───────────────────────

  async register(dto: RegisterDto) {
    if (!this.verifySSODomain(dto.email)) {
      throw new BadRequestException(
        'Email harus menggunakan domain BINUS (@binus.ac.id atau @student.binus.ac.id).',
      );
    }

    const exists = await this.prisma.user.count({ where: { email: dto.email } });
    if (exists > 0) throw new ConflictException('Email sudah terdaftar.');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        studentId: dto.studentId ?? null,
        isVerified: true,
        role: 'STUDENT',
      },
      select: {
        id: true, email: true, name: true,
        studentId: true, role: true, isVerified: true, avatarUrl: true,
      },
    });

    return { user, token: this.generateToken(user.id) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Email atau password salah.');
    if (!user.isActive) throw new UnauthorizedException('Akun Anda telah dinonaktifkan. Hubungi admin.');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Email atau password salah.');
    if (!this.verifySSODomain(user.email)) throw new UnauthorizedException('Verifikasi SSO BINUS gagal.');

    return {
      user: {
        id: user.id, email: user.email, name: user.name,
        studentId: user.studentId, role: user.role,
        isVerified: user.isVerified, avatarUrl: user.avatarUrl,
      },
      token: this.generateToken(user.id),
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, studentId: true,
        phone: true, bio: true, avatarUrl: true, role: true,
        isVerified: true, balance: true, escrow: true, createdAt: true,
        _count: { select: { listings: true, buyerTransactions: true, reviewsReceived: true } },
      },
    });
    if (!user) throw new UnauthorizedException('User tidak ditemukan.');
    return user;
  }
}
