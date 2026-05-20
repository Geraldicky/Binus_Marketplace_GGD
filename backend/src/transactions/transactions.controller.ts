// src/transactions/transactions.controller.ts

import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, TopupDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TransactionStatus } from '@prisma/client';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // Route statis HARUS sebelum route dinamis (:id)
  @Get('balance')
  async getBalance(@CurrentUser() user: any) {
    const data = await this.transactionsService.getBalance(user.id);
    return { success: true, data };
  }

  @Post('topup')
  async topup(@CurrentUser() user: any, @Body() dto: TopupDto) {
    const data = await this.transactionsService.topup(user.id, dto);
    return { success: true, message: `Topup Rp ${dto.amount.toLocaleString('id-ID')} berhasil!`, data };
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Query('role') role?: 'buyer' | 'seller') {
    const data = await this.transactionsService.findByUserId(user.id, role);
    return { success: true, data };
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.transactionsService.findById(id, user.id);
    return { success: true, data };
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateTransactionDto) {
    const data = await this.transactionsService.create(user.id, dto);
    return {
      success: true,
      message: 'Permintaan pembelian dibuat. Silakan lakukan pembayaran untuk melanjutkan.',
      data,
    };
  }

  @Post(':id/pay')
  async pay(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.transactionsService.pay(id, user.id);
    return { success: true, message: 'Pembayaran berhasil! Dana masuk ke escrow.', data };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('status') status: TransactionStatus,
  ) {
    const validStatuses: TransactionStatus[] = ['CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return { success: false, message: 'Status tidak valid.' };
    }
    const data = await this.transactionsService.updateStatus(id, user.id, status);
    return { success: true, message: `Status diubah menjadi ${status}.`, data };
  }
}
