// src/users/dto/user.dto.ts

import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class ChangePasswordDto {
  @IsString({ message: 'Password lama wajib diisi.' })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Password baru minimal 8 karakter.' })
  newPassword: string;
}
