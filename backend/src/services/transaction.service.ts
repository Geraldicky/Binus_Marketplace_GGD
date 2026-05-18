// src/services/transaction.service.ts
// Business logic untuk Transaction

import { TransactionStatus } from '@prisma/client';
import { TransactionRepository } from '../repositories/transaction.repository';
import { ListingRepository } from '../repositories/listing.repository';
import { CreateTransactionDto } from '../interfaces/index';

export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly listingRepository: ListingRepository,
  ) {}

  async getMyTransactions(userId: string, role?: 'buyer' | 'seller') {
    return this.transactionRepository.findByUserId(userId, role);
  }

  /**
   * Detail transaksi
   * Business rule: Hanya buyer/seller yang terlibat yang bisa lihat
   */
  async getById(id: string, userId: string) {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) throw new Error('Transaksi tidak ditemukan.');

    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new Error('Akses ditolak.');
    }

    return transaction;
  }

  /**
   * Buyer membuat permintaan transaksi
   * Business rules:
   * - Listing harus ada dan berstatus ACTIVE
   * - Buyer tidak boleh beli produk sendiri
   */
  async create(buyerId: string, data: CreateTransactionDto) {
    const listing = await this.listingRepository.findById(data.listingId);
    if (!listing) throw new Error('Listing tidak ditemukan.');

    if (listing.status !== 'ACTIVE') {
      throw new Error('Listing tidak tersedia.');
    }

    if (listing.sellerId === buyerId) {
      throw new Error('Anda tidak dapat membeli produk sendiri.');
    }

    return this.transactionRepository.create({
      listingId: data.listingId,
      buyerId,
      sellerId: listing.sellerId,
      price: Number(listing.price),
      note: data.note,
    });
  }

  /**
   * Update status transaksi
   * Business rules:
   * - CONFIRMED & COMPLETED hanya bisa dilakukan seller
   * - CANCELLED bisa dilakukan buyer atau seller
   * - Alur status: PENDING → CONFIRMED → COMPLETED
   *                PENDING/CONFIRMED → CANCELLED
   * - Jika COMPLETED dan tipe PRODUCT → listing jadi SOLD
   */
  async updateStatus(id: string, userId: string, status: TransactionStatus) {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) throw new Error('Transaksi tidak ditemukan.');

    const isBuyer = transaction.buyerId === userId;
    const isSeller = transaction.sellerId === userId;

    if (!isBuyer && !isSeller) throw new Error('Akses ditolak.');

    // Validasi permission
    if (status === 'CONFIRMED' && !isSeller) {
      throw new Error('Hanya seller yang bisa mengkonfirmasi transaksi.');
    }
    if (status === 'COMPLETED' && !isSeller) {
      throw new Error('Hanya seller yang bisa menyelesaikan transaksi.');
    }

    // Validasi alur status
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!allowedTransitions[transaction.status]?.includes(status)) {
      throw new Error(
        `Tidak dapat mengubah status dari ${transaction.status} ke ${status}.`,
      );
    }

    const updated = await this.transactionRepository.updateStatus(id, status);

    // Jika selesai dan listing adalah PRODUCT, tandai sebagai SOLD
    if (status === 'COMPLETED') {
      const listing = await this.listingRepository.findById(transaction.listingId);
      if (listing?.type === 'PRODUCT') {
        await this.listingRepository.markAsSold(transaction.listingId);
      }
    }

    return updated;
  }
}
