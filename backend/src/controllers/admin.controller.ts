// src/controllers/admin.controller.ts

import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { ResponseHelper } from '../lib/response';
import { AuthenticatedRequest } from '../interfaces/auth.interface';

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** GET /api/admin/dashboard */
  getDashboard = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.adminService.getDashboardStats();
      ResponseHelper.success(res, stats);
    } catch (error) {
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Terjadi kesalahan server.');
    }
  };

  /** GET /api/admin/listings/pending */
  getPendingListings = async (_req: Request, res: Response): Promise<void> => {
    try {
      const listings = await this.adminService.getPendingListings();
      ResponseHelper.success(res, listings);
    } catch (error) {
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Terjadi kesalahan server.');
    }
  };

  /** PATCH /api/admin/listings/:id/moderate */
  moderateListing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { action } = req.body;
      if (!['approve', 'reject'].includes(action)) {
        ResponseHelper.badRequest(res, 'Action harus approve atau reject.');
        return;
      }
      const result = await this.adminService.moderateListing(req.params.id, action);
      const msg = action === 'approve' ? 'Listing berhasil disetujui.' : 'Listing berhasil ditolak.';
      ResponseHelper.success(res, result, msg);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      ResponseHelper.error(res, message, message.includes('tidak ditemukan') ? 404 : 400);
    }
  };

  /** GET /api/admin/users */
  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { keyword, page = '1', limit = '20' } = req.query;
      const take = parseInt(limit as string);
      const skip = (parseInt(page as string) - 1) * take;

      const { users, total } = await this.adminService.getAllUsers({
        keyword: keyword as string | undefined,
        skip,
        take,
      });

      ResponseHelper.paginated(res, users, {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
      });
    } catch (error) {
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Terjadi kesalahan server.');
    }
  };

  /** PATCH /api/admin/users/:id/toggle */
  toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = (req as AuthenticatedRequest).user.id;
      const result = await this.adminService.toggleUserStatus(req.params.id, adminId);
      const msg = (result as any).isActive ? 'User berhasil diaktifkan.' : 'User berhasil dinonaktifkan.';
      ResponseHelper.success(res, result, msg);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      ResponseHelper.error(res, message, message.includes('tidak ditemukan') ? 404 : 400);
    }
  };

  /** GET /api/admin/complaints */
  getComplaints = async (req: Request, res: Response): Promise<void> => {
    try {
      const complaints = await this.adminService.getComplaints(req.query.status as string);
      ResponseHelper.success(res, complaints);
    } catch (error) {
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Terjadi kesalahan server.');
    }
  };

  /** PATCH /api/admin/complaints/:id */
  updateComplaintStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, adminNote } = req.body;
      const validStatuses = ['IN_REVIEW', 'RESOLVED', 'DISMISSED'];
      if (!validStatuses.includes(status)) {
        ResponseHelper.badRequest(res, 'Status tidak valid.');
        return;
      }
      const result = await this.adminService.updateComplaintStatus(req.params.id, { status, adminNote });
      ResponseHelper.success(res, result, 'Status pengaduan diperbarui.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      ResponseHelper.error(res, message, message.includes('tidak ditemukan') ? 404 : 400);
    }
  };
}
