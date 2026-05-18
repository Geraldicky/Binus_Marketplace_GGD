// src/controllers/review.controller.ts

import { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';
import { ResponseHelper } from '../lib/response';
import { AuthenticatedRequest } from '../interfaces/auth.interface';

export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /** POST /api/reviews */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const reviewerId = (req as AuthenticatedRequest).user.id;
      const { transactionId, rating, comment } = req.body;

      if (!transactionId || !rating) {
        ResponseHelper.badRequest(res, 'transactionId dan rating wajib diisi.');
        return;
      }

      const review = await this.reviewService.create(reviewerId, {
        transactionId,
        rating: parseInt(rating),
        comment,
      });

      ResponseHelper.created(res, review, 'Review berhasil dikirim.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      const code = message.includes('tidak ditemukan') ? 404
        : message.includes('sudah') ? 409 : 400;
      ResponseHelper.error(res, message, code);
    }
  };

  /** GET /api/reviews/user/:userId */
  getUserReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.reviewService.getUserReviews(req.params.userId);
      ResponseHelper.success(res, result);
    } catch (error) {
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Terjadi kesalahan server.');
    }
  };
}
