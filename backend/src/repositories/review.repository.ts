// src/repositories/review.repository.ts

import { BaseRepository } from './base.repository';
import { CreateReviewDto } from '../interfaces/index';

export class ReviewRepository extends BaseRepository {

  async create(reviewerId: string, revieweeId: string, data: CreateReviewDto) {
    return this.db.review.create({
      data: {
        transactionId: data.transactionId,
        reviewerId,
        revieweeId,
        rating: data.rating,
        comment: data.comment ?? null,
      },
    });
  }

  async findByTransactionId(transactionId: string) {
    return this.db.review.findUnique({ where: { transactionId } });
  }

  async findByRevieweeId(revieweeId: string) {
    return this.db.review.findMany({
      where: { revieweeId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
        transaction: { include: { listing: { select: { title: true } } } },
      },
    });
  }

  async getAverageRating(revieweeId: string) {
    return this.db.review.aggregate({
      where: { revieweeId },
      _avg: { rating: true },
      _count: true,
    });
  }
}
