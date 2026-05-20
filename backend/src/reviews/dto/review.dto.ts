// src/reviews/dto/review.dto.ts

import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsString()
  transactionId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1) @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
