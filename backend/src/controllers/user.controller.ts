// src/controllers/user.controller.ts

import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ResponseHelper } from '../lib/response';
import { AuthenticatedRequest } from '../interfaces/auth.interface';

export class UserController {
  constructor(private readonly userService: UserService) {}

  /** GET /api/users/:id */
  getPublicProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const profile = await this.userService.getPublicProfile(req.params.id);
      ResponseHelper.success(res, profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      ResponseHelper.error(res, message, message.includes('tidak ditemukan') ? 404 : 500);
    }
  };

  /** PUT /api/users/me */
  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { name, phone, bio } = req.body;
      const updated = await this.userService.updateProfile(userId, { name, phone, bio });
      ResponseHelper.success(res, updated, 'Profil berhasil diperbarui.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      ResponseHelper.error(res, message, 400);
    }
  };

  /** PUT /api/users/me/password */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        ResponseHelper.badRequest(res, 'Password lama dan baru wajib diisi.');
        return;
      }

      await this.userService.changePassword(userId, { currentPassword, newPassword });
      ResponseHelper.success(res, null, 'Password berhasil diubah.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      ResponseHelper.error(res, message, message.includes('tidak sesuai') ? 401 : 400);
    }
  };
}
