// src/admin/admin.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListingsService } from '../listings/listings.service';
import { ComplaintsService } from '../complaints/complaints.service';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private listingsService: ListingsService,
    private complaintsService: ComplaintsService,
    private transactionsService: TransactionsService,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers, totalListings, pendingListings,
      totalTransactions, openComplaints, totalRevenue,
      commissionSetting,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.listingsService.countByStatus('ACTIVE'),
      this.listingsService.countByStatus('PENDING'),
      this.transactionsService.count(),
      this.complaintsService.countByStatus('OPEN'),
      this.transactionsService.totalCommissionCollected(),
      this.prisma.commissionSetting.findFirst({ orderBy: { createdAt: 'desc' } }),
    ]);

    return {
      totalUsers, totalListings, pendingListings,
      totalTransactions, openComplaints, totalRevenue,
      currentCommissionRate: commissionSetting ? Number(commissionSetting.rate) : 5.0,
    };
  }

  // ── Listings ──────────────────────────────

  getPendingListings() {
    return this.listingsService.findPending();
  }

  moderateListing(id: string, action: 'approve' | 'reject') {
    return this.listingsService.moderate(id, action);
  }

  // ── Users ─────────────────────────────────

  async getAllUsers(keyword?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { role: 'STUDENT' };
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { email: { contains: keyword } },
        { studentId: { contains: keyword } },
      ];
    }
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, studentId: true,
          role: true, isActive: true, isVerified: true, createdAt: true,
          _count: { select: { listings: true, buyerTransactions: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleUserStatus(targetId: string, adminId: string) {
    if (targetId === adminId) throw new BadRequestException('Tidak dapat menonaktifkan akun sendiri.');
    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException('User tidak ditemukan.');
    return this.prisma.user.update({
      where: { id: targetId },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, isActive: true },
    });
  }

  // ── Complaints ────────────────────────────

  getComplaints(status?: string) {
    return this.complaintsService.findAll(status);
  }

  updateComplaintStatus(id: string, status: string, adminNote?: string) {
    return this.complaintsService.updateStatus(id, status, adminNote);
  }

  // ── Commission ────────────────────────────

  async getCurrentCommission() {
    const setting = await this.prisma.commissionSetting.findFirst({ orderBy: { createdAt: 'desc' } });
    return { rate: setting ? Number(setting.rate) : 5.0 };
  }

  async setCommissionRate(rate: number) {
    if (rate < 0 || rate > 100) throw new BadRequestException('Komisi harus antara 0% sampai 100%.');
    return this.prisma.commissionSetting.create({ data: { rate } });
  }

  async getCommissionHistory() {
    return this.prisma.commissionSetting.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
  }
}
