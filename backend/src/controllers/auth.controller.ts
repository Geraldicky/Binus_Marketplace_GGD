// src/controllers/auth.controller.ts
// =============================================
// Controller hanya bertugas:
// 1. Ambil data dari request
// 2. Panggil service
// 3. Kembalikan response
//
// TIDAK ada business logic di sini.
// TIDAK ada query database di sini.
// =============================================

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ResponseHelper } from '../lib/response';
import { AuthenticatedRequest } from '../interfaces/auth.interface';

export class AuthController {
  // Dependency Injection: AuthService di-inject via constructor
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name, studentId } = req.body;

      if (!email || !password || !name) {
        ResponseHelper.badRequest(res, 'Email, password, dan nama wajib diisi.');
        return;
      }

      const result = await this.authService.register({ email, password, name, studentId });
      ResponseHelper.created(res, result, 'Registrasi berhasil! Selamat datang di BINUS Marketplace.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      const statusCode = this.resolveErrorCode(message);
      ResponseHelper.error(res, message, statusCode);
    }
  };

  /**
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        ResponseHelper.badRequest(res, 'Email dan password wajib diisi.');
        return;
      }

      const result = await this.authService.login({ email, password });
      ResponseHelper.success(res, result, `Selamat datang kembali, ${result.user.name}!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      ResponseHelper.error(res, message, 401);
    }
  };

  /**
   * GET /api/auth/me
   */
  getMe = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const user = await this.authService.getMe(userId);
      ResponseHelper.success(res, user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      ResponseHelper.error(res, message);
    }
  };

  // Helper: tentukan HTTP status code dari pesan error
  private resolveErrorCode(message: string): number {
    if (message.includes('sudah terdaftar')) return 409;
    if (message.includes('tidak valid') || message.includes('salah')) return 401;
    if (message.includes('minimal') || message.includes('wajib')) return 400;
    return 400;
  }
}
