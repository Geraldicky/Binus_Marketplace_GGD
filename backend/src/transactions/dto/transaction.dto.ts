// src/transactions/dto/transaction.dto.ts

import { IsString, IsOptional, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsString()
  listingId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class TopupDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1000, { message: 'Minimal topup Rp 1.000.' })
  amount: number;
}
