// src/middleware/auth.middleware.ts
// Middleware untuk verifikasi JWT token

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { ResponseHelper } from '../lib/response';
import { JwtPayload, AuthenticatedRequest } from '../interfaces/auth.interface';

/**
 * Middleware: Verifikasi JWT token dari header Authorization
 * Tambahkan ke req.user agar controller bisa akses data user
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ResponseHelper.unauthorized(res, 'Token tidak ditemukan. Silakan login terlebih dahulu.');
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET tidak dikonfigurasi');

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Verifikasi user masih ada dan aktif di database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

    if (!user || !user.isActive) {
      ResponseHelper.unauthorized(res, 'Akun tidak ditemukan atau tidak aktif.');
      return;
    }

    // Inject data user ke dalam request
    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      ResponseHelper.unauthorized(res, 'Sesi telah berakhir. Silakan login kembali.');
      return;
    }
    ResponseHelper.unauthorized(res, 'Token tidak valid.');
  }
};

/**
 * Middleware: Hanya Admin yang boleh akses
 * Harus dipanggil setelah middleware authenticate
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const user = (req as AuthenticatedRequest).user;

  if (user.role !== 'ADMIN') {
    ResponseHelper.forbidden(res, 'Akses ditolak. Hanya admin yang dapat melakukan ini.');
    return;
  }

  next();
};
