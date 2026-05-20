// src/complaints/dto/complaint.dto.ts

import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ComplaintTarget } from '@prisma/client';

export class CreateComplaintDto {
  @IsEnum(ComplaintTarget)
  targetType: ComplaintTarget;

  @IsString()
  targetId: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;
}
