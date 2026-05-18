// src/controllers/transaction.controller.ts

import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { ResponseHelper } from '../lib/response';
import { AuthenticatedRequest } from '../interfaces/auth.interface';
import { TransactionStatus } from '@prisma/client';

export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  /** GET /api/transactions */
  getMyTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const role = req.query.role as 'buyer' | 'seller' | undefined;
      const transactions = await this.transactionService.getMyTransactions(userId, role);
      ResponseHelper.success(res, transactions);
    } catch (error) {
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Terjadi kesalahan server.');
    }
  };

  /** GET /api/transactions/:id */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const transaction = await this.transactionService.getById(req.params.id, userId);
      ResponseHelper.success(res, transaction);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      const code = message.includes('tidak ditemukan') ? 404
        : message.includes('ditolak') ? 403 : 500;
      ResponseHelper.error(res, message, code);
    }
  };

  /** POST /api/transactions */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const buyerId = (req as AuthenticatedRequest).user.id;
      const { listingId, note } = req.body;

      if (!listingId) {
        ResponseHelper.badRequest(res, 'listingId wajib diisi.');
        return;
      }

      const transaction = await this.transactionService.create(buyerId, { listingId, note });
      ResponseHelper.created(res, transaction, 'Permintaan pembelian berhasil dikirim ke seller.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      const code = message.includes('tidak ditemukan') ? 404
        : message.includes('sendiri') ? 400 : 400;
      ResponseHelper.error(res, message, code);
    }
  };

  /** PATCH /api/transactions/:id/status */
  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { status } = req.body;

      const validStatuses: TransactionStatus[] = ['CONFIRMED', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        ResponseHelper.badRequest(res, 'Status tidak valid.');
        return;
      }

      const updated = await this.transactionService.updateStatus(req.params.id, userId, status);
      ResponseHelper.success(res, updated, `Status transaksi berhasil diubah menjadi ${status}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      const code = message.includes('tidak ditemukan') ? 404
        : message.includes('ditolak') ? 403 : 400;
      ResponseHelper.error(res, message, code);
    }
  };
}
