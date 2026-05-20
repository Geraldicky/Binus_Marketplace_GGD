// src/transactions/transactions.module.ts

import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { ListingsModule } from '../listings/listings.module';

@Module({
  imports: [ListingsModule], // Import ListingsModule agar bisa pakai ListingsService
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
