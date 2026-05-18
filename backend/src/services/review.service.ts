// src/services/review.service.ts
// Business logic untuk Review

import { ReviewRepository } from '../repositories/review.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { CreateReviewDto } from '../interfaces/index';

export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  /**
   * Buat review setelah transaksi selesai
   * Business rules:
   * - Hanya buyer yang bisa review
   * - Transaksi harus berstatus COMPLETED
   * - Rating harus antara 1-5
   * - Satu transaksi hanya bisa direview sekali
   */
  async create(reviewerId: string, data: CreateReviewDto) {
    // Rule: Rating 1-5
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating harus antara 1 sampai 5.');
    }

    const transaction = await this.transactionRepository.findById(data.transactionId);
    if (!transaction) throw new Error('Transaksi tidak ditemukan.');

    // Rule: Hanya buyer yang bisa review
    if (transaction.buyerId !== reviewerId) {
      throw new Error('Hanya pembeli yang dapat memberikan review.');
    }

    // Rule: Transaksi harus COMPLETED
    if (transaction.status !== 'COMPLETED') {
      throw new Error('Review hanya dapat diberikan setelah transaksi selesai.');
    }

    // Rule: Belum pernah direview
    const existingReview = await this.reviewRepository.findByTransactionId(data.transactionId);
    if (existingReview) {
      throw new Error('Anda sudah memberikan review untuk transaksi ini.');
    }

    return this.reviewRepository.create(reviewerId, transaction.sellerId, data);
  }

  /**
   * Ambil semua review yang diterima user beserta rata-rata rating
   */
  async getUserReviews(revieweeId: string) {
    const [reviews, aggregate] = await Promise.all([
      this.reviewRepository.findByRevieweeId(revieweeId),
      this.reviewRepository.getAverageRating(revieweeId),
    ]);

    return {
      reviews,
      avgRating: aggregate._avg.rating ?? 0,
      totalReviews: aggregate._count,
    };
  }
}
