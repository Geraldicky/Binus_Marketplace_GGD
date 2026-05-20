// src/common/filters/http-exception.filter.ts
// Filter global untuk format semua error response secara konsisten

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Terjadi kesalahan server.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message ?? message;

      // Kalau message adalah array (dari class-validator), ambil yang pertama
      if (Array.isArray(message)) {
        message = message[0];
      }
    } else if (exception instanceof Error) {
      // Business logic error dari service
      message = exception.message;
      // Tentukan status code berdasarkan pesan
      if (message.includes('tidak ditemukan')) status = HttpStatus.NOT_FOUND;
      else if (message.includes('ditolak') || message.includes('tidak berhak')) status = HttpStatus.FORBIDDEN;
      else if (message.includes('sudah terdaftar') || message.includes('sudah ada')) status = HttpStatus.CONFLICT;
      else if (message.includes('tidak valid') || message.includes('wajib') || message.includes('minimal')) status = HttpStatus.BAD_REQUEST;
      else if (message.includes('salah') || message.includes('tidak sesuai')) status = HttpStatus.UNAUTHORIZED;
      else status = HttpStatus.BAD_REQUEST;
    }

    response.status(status).json({
      success: false,
      message,
      statusCode: status,
    });
  }
}
