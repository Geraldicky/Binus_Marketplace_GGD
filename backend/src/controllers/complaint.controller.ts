// src/controllers/complaint.controller.ts

import { Request, Response } from 'express';
import { ComplaintService } from '../services/complaint.service';
import { ResponseHelper } from '../lib/response';
import { AuthenticatedRequest } from '../interfaces/auth.interface';
import { ComplaintTarget } from '@prisma/client';

export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  /** POST /api/complaints */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const reporterId = (req as AuthenticatedRequest).user.id;
      const { targetType, targetId, reason, description } = req.body;

      if (!targetType || !targetId || !reason) {
        ResponseHelper.badRequest(res, 'targetType, targetId, dan reason wajib diisi.');
        return;
      }

      const complaint = await this.complaintService.create(reporterId, {
        targetType: targetType as ComplaintTarget,
        targetId,
        reason,
        description,
      });

      ResponseHelper.created(res, complaint, 'Pengaduan berhasil dikirim.');
    } catch (error) {
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Terjadi kesalahan server.', 400);
    }
  };
}
