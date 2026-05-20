// src/auth/strategies/jwt.strategy.ts
// Strategy untuk memvalidasi JWT token
// Dipakai oleh JwtAuthGuard secara otomatis

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback_secret',
    });
  }

  // Dipanggil otomatis setelah token terverifikasi
  // Return value akan di-inject ke request.user
  async validate(payload: { userId: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
        avatarUrl: true,
      },
    });

    if (!user) throw new UnauthorizedException('User tidak ditemukan.');
    return user;
  }
}
