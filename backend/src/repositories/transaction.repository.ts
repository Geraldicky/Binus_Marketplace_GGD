// src/repositories/transaction.repository.ts

import { TransactionStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class TransactionRepository extends BaseRepository {

  async findByUserId(userId: string, role?: 'buyer' | 'seller') {
    const where: Record<string, unknown> = {};
    if (role === 'buyer') where.buyerId = userId;
    else if (role === 'seller') where.sellerId = userId;
    else where.OR = [{ buyerId: userId }, { sellerId: userId }];

    return this.db.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { select: { id: true, title: true, images: true, type: true } },
        buyer: { select: { id: true, name: true, avatarUrl: true } },
        seller: { select: { id: true, name: true, avatarUrl: true } },
        review: { select: { id: true, rating: true, comment: true } },
      },
    });
  }

  async findById(id: string) {
    return this.db.transaction.findUnique({
      where: { id },
      include: {
        listing: true,
        buyer: { select: { id: true, name: true, email: true, avatarUrl: true, phone: true } },
        seller: { select: { id: true, name: true, email: true, avatarUrl: true, phone: true } },
        review: true,
      },
    });
  }

  async create(data: {
    listingId: string;
    buyerId: string;
    sellerId: string;
    price: number;
    note?: string;
  }) {
    return this.db.transaction.create({
      data: {
        listingId: data.listingId,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        price: data.price,
        note: data.note ?? null,
        status: 'PENDING',
      },
      include: {
        listing: { select: { id: true, title: true, images: true } },
        seller: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async updateStatus(id: string, status: TransactionStatus) {
    return this.db.transaction.update({
      where: { id },
      data: { status },
    });
  }

  async count(): Promise<number> {
    return this.db.transaction.count();
  }
}
