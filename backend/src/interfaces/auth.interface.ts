// src/interfaces/auth.interface.ts
// =============================================
// Kontrak TypeScript untuk Auth
// Interface ini dipakai oleh Service dan Controller
// sehingga semua layer "berbicara bahasa yang sama"
// =============================================

import { Role } from '@prisma/client';

// ── Request Payloads ──────────────────────────

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  studentId?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

// ── Response Payloads ─────────────────────────

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  studentId: string | null;
  role: Role;
  isVerified: boolean;
  avatarUrl: string | null;
}

export interface AuthResponse {
  user: AuthUserPayload;
  token: string;
}

// ── JWT Payload (isi token) ───────────────────

export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// ── Express Request Extension ─────────────────
// Menambahkan field 'user' ke Request object Express

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    isVerified: boolean;
    isActive: boolean;
    avatarUrl: string | null;
  };
}
