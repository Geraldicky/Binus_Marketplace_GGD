// src/auth/dto/auth.dto.ts
// Data Transfer Object — validasi input otomatis dengan class-validator
// Menggantikan validasi manual if (!email || !password) di Express

import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Format email tidak valid.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter.' })
  password: string;

  @IsString({ message: 'Nama wajib diisi.' })
  name: string;

  @IsOptional()
  @IsString()
  studentId?: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Format email tidak valid.' })
  email: string;

  @IsString({ message: 'Password wajib diisi.' })
  password: string;
}
