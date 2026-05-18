// src/lib/response.ts
// Helper untuk format response API yang konsisten

import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ResponseHelper {
  static success<T>(res: Response, data: T, message = 'Berhasil', statusCode = 200): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    } as ApiResponse<T>);
  }

  static created<T>(res: Response, data: T, message = 'Berhasil dibuat'): Response {
    return ResponseHelper.success(res, data, message, 201);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    meta: PaginationMeta,
    message = 'Berhasil',
  ): Response {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: meta,
    } as ApiResponse<T[]>);
  }

  static error(res: Response, message: string, statusCode = 500): Response {
    return res.status(statusCode).json({
      success: false,
      message,
    } as ApiResponse);
  }

  static notFound(res: Response, message = 'Data tidak ditemukan'): Response {
    return ResponseHelper.error(res, message, 404);
  }

  static unauthorized(res: Response, message = 'Tidak terautentikasi'): Response {
    return ResponseHelper.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Akses ditolak'): Response {
    return ResponseHelper.error(res, message, 403);
  }

  static badRequest(res: Response, message: string): Response {
    return ResponseHelper.error(res, message, 400);
  }

  static conflict(res: Response, message: string): Response {
    return ResponseHelper.error(res, message, 409);
  }
}
