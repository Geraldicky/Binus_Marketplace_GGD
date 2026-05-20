// src/admin/admin.controller.ts

import {
  Controller, Get, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard) // Semua endpoint admin butuh JWT + role ADMIN
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    const data = await this.adminService.getDashboardStats();
    return { success: true, data };
  }

  // ── Listings ──────────────────────────────

  @Get('listings/pending')
  async getPendingListings() {
    const data = await this.adminService.getPendingListings();
    return { success: true, data, total: data.length };
  }

  @Patch('listings/:id/moderate')
  async moderateListing(
    @Param('id') id: string,
    @Body('action') action: 'approve' | 'reject',
  ) {
    if (!['approve', 'reject'].includes(action)) {
      return { success: false, message: 'Action harus approve atau reject.' };
    }
    await this.adminService.moderateListing(id, action);
    const msg = action === 'approve' ? 'Listing berhasil disetujui.' : 'Listing berhasil ditolak.';
    return { success: true, message: msg };
  }

  // ── Users ─────────────────────────────────

  @Get('users')
  async getAllUsers(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.adminService.getAllUsers(
      keyword,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
    return { success: true, data: result.users, pagination: result };
  }

  @Patch('users/:id/toggle')
  async toggleUserStatus(@Param('id') id: string, @CurrentUser() admin: any) {
    const result = await this.adminService.toggleUserStatus(id, admin.id);
    const msg = (result as any).isActive ? 'User berhasil diaktifkan.' : 'User berhasil dinonaktifkan.';
    return { success: true, message: msg, data: result };
  }

  // ── Complaints ────────────────────────────

  @Get('complaints')
  async getComplaints(@Query('status') status?: string) {
    const data = await this.adminService.getComplaints(status);
    return { success: true, data };
  }

  @Patch('complaints/:id')
  async updateComplaintStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('adminNote') adminNote?: string,
  ) {
    const validStatuses = ['IN_REVIEW', 'RESOLVED', 'DISMISSED'];
    if (!validStatuses.includes(status)) {
      return { success: false, message: 'Status tidak valid.' };
    }
    const data = await this.adminService.updateComplaintStatus(id, status, adminNote);
    return { success: true, message: 'Status pengaduan diperbarui.', data };
  }

  // ── Commission ────────────────────────────

  @Get('commission')
  async getCommission() {
    const data = await this.adminService.getCurrentCommission();
    return { success: true, data };
  }

  @Patch('commission')
  async setCommission(@Body('rate') rate: number) {
    const data = await this.adminService.setCommissionRate(rate);
    return { success: true, message: `Komisi berhasil diubah menjadi ${rate}%.`, data };
  }

  @Get('commission/history')
  async getCommissionHistory() {
    const data = await this.adminService.getCommissionHistory();
    return { success: true, data };
  }
}
