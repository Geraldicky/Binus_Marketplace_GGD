// src/services/admin.service.ts
// Business logic untuk Admin

import { Role } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { ListingRepository } from '../repositories/listing.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { ComplaintRepository } from '../repositories/complaint.repository';
import { DashboardStats, UpdateComplaintDto } from '../interfaces/index';

export class AdminService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly listingRepository: ListingRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly complaintRepository: ComplaintRepository,
  ) {}

  /**
   * Statistik untuk dashboard admin
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const [totalUsers, totalListings, pendingListings, totalTransactions, openComplaints] =
      await Promise.all([
        this.userRepository.findAll({ skip: 0, take: 0, role: 'STUDENT' as Role }).then((r) => r.total),
        this.listingRepository.countByStatus('ACTIVE'),
        this.listingRepository.countByStatus('PENDING'),
        this.transactionRepository.count(),
        this.complaintRepository.countByStatus('OPEN'),
      ]);

    return { totalUsers, totalListings, pendingListings, totalTransactions, openComplaints };
  }

  // ── Listing Moderation ────────────────────

  async getPendingListings() {
    return this.listingRepository.findPending();
  }

  async moderateListing(id: string, action: 'approve' | 'reject') {
    const listing = await this.listingRepository.findById(id);
    if (!listing) throw new Error('Listing tidak ditemukan.');
    return this.listingRepository.moderate(id, action);
  }

  // ── User Management ───────────────────────

  async getAllUsers(params: { keyword?: string; skip: number; take: number }) {
    return this.userRepository.findAll(params);
  }

  /**
   * Toggle aktif/nonaktif user
   * Business rule: Admin tidak boleh menonaktifkan dirinya sendiri
   */
  async toggleUserStatus(targetId: string, adminId: string) {
    if (targetId === adminId) {
      throw new Error('Tidak dapat menonaktifkan akun sendiri.');
    }

    const target = await this.userRepository.findById(targetId);
    if (!target) throw new Error('User tidak ditemukan.');

    return this.userRepository.toggleActive(targetId);
  }

  // ── Complaint Management ──────────────────

  async getComplaints(status?: string) {
    return this.complaintRepository.findAll(status as any);
  }

  async updateComplaintStatus(id: string, data: UpdateComplaintDto) {
    const complaint = await this.complaintRepository.findById(id);
    if (!complaint) throw new Error('Pengaduan tidak ditemukan.');

    return this.complaintRepository.updateStatus(id, data.status as any, data.adminNote);
  }
}
