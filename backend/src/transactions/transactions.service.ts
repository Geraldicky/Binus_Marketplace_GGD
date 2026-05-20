// src/transactions/transactions.service.ts

import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListingsService } from '../listings/listings.service';
import { CreateTransactionDto, TopupDto } from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private listingsService: ListingsService,
  ) {}

  private async getActiveCommissionRate(): Promise<number> {
    const setting = await this.prisma.commissionSetting.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    return setting ? Number(setting.rate) : 5.0;
  }

  async findByUserId(userId: string, role?: 'buyer' | 'seller') {
    const where: any = {};
    if (role === 'buyer')  where.buyerId  = userId;
    else if (role === 'seller') where.sellerId = userId;
    else where.OR = [{ buyerId: userId }, { sellerId: userId }];

    return this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { select: { id: true, title: true, images: true, type: true } },
        buyer:   { select: { id: true, name: true, avatarUrl: true } },
        seller:  { select: { id: true, name: true, avatarUrl: true } },
        review:  { select: { id: true, rating: true, comment: true } },
      },
    });
  }

  async findById(id: string, userId: string) {
    const t = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        listing: true,
        buyer:   { select: { id: true, name: true, email: true, avatarUrl: true, phone: true } },
        seller:  { select: { id: true, name: true, email: true, avatarUrl: true, phone: true } },
        review:  true,
      },
    });
    if (!t) throw new NotFoundException('Transaksi tidak ditemukan.');
    if (t.buyerId !== userId && t.sellerId !== userId) throw new ForbiddenException('Akses ditolak.');
    return t;
  }

  async create(buyerId: string, dto: CreateTransactionDto) {
    const listing = await this.listingsService.findById(dto.listingId);
    if (listing.status !== 'ACTIVE') throw new BadRequestException('Listing tidak tersedia.');
    if (listing.sellerId === buyerId) throw new BadRequestException('Anda tidak dapat membeli produk sendiri.');

    const quantity = dto.quantity ?? 1;

    if (listing.type === 'PRODUCT' && listing.stockLeft !== null) {
      if (listing.stockLeft <= 0) throw new BadRequestException('Stok produk habis.');
      if (quantity > listing.stockLeft) {
        throw new BadRequestException(`Stok tidak cukup. Tersedia: ${listing.stockLeft}.`);
      }
    }

    if (listing.type === 'PRODUCT' && listing.stockLeft !== null) {
      await this.listingsService.decrementStock(listing.id, quantity);
    }

    const price = Number(listing.price);
    const totalPrice = price * quantity;
    const commissionRate = await this.getActiveCommissionRate();
    const commissionAmt = (totalPrice * commissionRate) / 100;
    const sellerReceives = totalPrice - commissionAmt;

    return this.prisma.transaction.create({
      data: {
        listingId: dto.listingId,
        buyerId,
        sellerId: listing.sellerId,
        price,
        quantity,
        totalPrice,
        commissionRate,
        commissionAmt,
        sellerReceives,
        note: dto.note ?? null,
        status: 'PENDING',
      },
      include: {
        listing: { select: { id: true, title: true, images: true } },
        seller:  { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async pay(id: string, buyerId: string) {
    const t = await this.prisma.transaction.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Transaksi tidak ditemukan.');
    if (t.buyerId !== buyerId) throw new ForbiddenException('Akses ditolak.');
    if (t.status !== 'PENDING') throw new BadRequestException('Transaksi sudah dibayar atau tidak valid.');

    const totalPrice = Number(t.totalPrice ?? t.price);
    const buyer = await this.prisma.user.findUnique({ where: { id: buyerId } });
    if (!buyer) throw new NotFoundException('User tidak ditemukan.');

    if (Number(buyer.balance) < totalPrice) {
      throw new BadRequestException(
        `Saldo tidak cukup. Saldo kamu: Rp ${Number(buyer.balance).toLocaleString('id-ID')}, dibutuhkan: Rp ${totalPrice.toLocaleString('id-ID')}.`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: buyerId },
        data: { balance: { decrement: totalPrice }, escrow: { increment: totalPrice } },
      }),
      this.prisma.transaction.update({ where: { id }, data: { status: 'PAID', isEscrowHeld: true } }),
    ]);

    return this.prisma.transaction.findUnique({ where: { id }, include: { listing: true, buyer: true, seller: true } });
  }

  async updateStatus(id: string, userId: string, status: TransactionStatus) {
    const t = await this.prisma.transaction.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Transaksi tidak ditemukan.');

    const isBuyer  = t.buyerId  === userId;
    const isSeller = t.sellerId === userId;
    if (!isBuyer && !isSeller) throw new ForbiddenException('Akses ditolak.');

    if (status === 'CONFIRMED' && !isSeller) throw new ForbiddenException('Hanya seller yang bisa mengkonfirmasi.');
    if (status === 'COMPLETED' && !isSeller) throw new ForbiddenException('Hanya seller yang bisa menyelesaikan transaksi.');

    const allowed: Record<string, string[]> = {
      PENDING: ['CANCELLED'],
      PAID: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [], CANCELLED: [],
    };
    if (!allowed[t.status]?.includes(status)) {
      throw new BadRequestException(`Tidak dapat mengubah status dari ${t.status} ke ${status}.`);
    }

    const totalPrice = Number((t as any).totalPrice ?? t.price);

    // COMPLETED: lepas escrow ke seller
    if (status === 'COMPLETED' && t.isEscrowHeld) {
      const sellerReceives = Number(t.sellerReceives);
      await this.prisma.$transaction([
        this.prisma.user.update({ where: { id: t.buyerId },  data: { escrow:   { decrement: totalPrice }    } }),
        this.prisma.user.update({ where: { id: t.sellerId }, data: { balance:  { increment: sellerReceives } } }),
        this.prisma.transaction.update({ where: { id }, data: { status: 'COMPLETED' } }),
      ]);
      const listing = await this.listingsService.findById(t.listingId).catch(() => null);
      if (listing?.type === 'PRODUCT' && listing.stockLeft !== null && listing.stockLeft <= 0) {
        await this.listingsService.markAsSold(t.listingId);
      }
      return this.prisma.transaction.findUnique({ where: { id } });
    }

    // CANCELLED: refund
    if (status === 'CANCELLED') {
      if (t.isEscrowHeld) {
        await this.prisma.$transaction([
          this.prisma.user.update({
            where: { id: t.buyerId },
            data: { balance: { increment: totalPrice }, escrow: { decrement: totalPrice } },
          }),
          this.prisma.transaction.update({ where: { id }, data: { status: 'CANCELLED', isEscrowHeld: false } }),
        ]);
      } else {
        await this.prisma.transaction.update({ where: { id }, data: { status: 'CANCELLED' } });
      }
      const listing = await this.listingsService.findById(t.listingId).catch(() => null);
      if (listing?.type === 'PRODUCT' && listing.stockLeft !== null) {
        await this.listingsService.incrementStock(t.listingId, (t as any).quantity ?? 1);
      }
      return this.prisma.transaction.findUnique({ where: { id } });
    }

    return this.prisma.transaction.update({ where: { id }, data: { status } });
  }

  async topup(userId: string, dto: TopupDto) {
    if (dto.amount > 10000000) throw new BadRequestException('Maksimal topup Rp 10.000.000.');
    return this.prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: dto.amount } },
      select: { id: true, name: true, balance: true, escrow: true },
    });
  }

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true, escrow: true },
    });
    if (!user) throw new NotFoundException('User tidak ditemukan.');
    return { balance: Number(user.balance), escrow: Number(user.escrow) };
  }

  async count(): Promise<number> {
    return this.prisma.transaction.count();
  }

  async totalCommissionCollected(): Promise<number> {
    const r = await this.prisma.transaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { commissionAmt: true },
    });
    return Number(r._sum.commissionAmt ?? 0);
  }
}
