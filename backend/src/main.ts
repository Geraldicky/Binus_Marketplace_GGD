// src/main.ts
// =============================================
// Entry point NestJS
// Jauh lebih sederhana dari Express index.ts
// karena NestJS sudah handle semua setup otomatis
// =============================================

import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  

  // Prefix semua route dengan /api
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global Validation Pipe
  // Otomatis validasi semua @Body() menggunakan class-validator
  // Menggantikan validasi manual if (!email || !password) di Express
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Hapus field yang tidak ada di DTO
      forbidNonWhitelisted: false,
      transform: true,          // Otomatis convert tipe (string → number, dll)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter
  // Semua error di-format secara konsisten
  app.useGlobalFilters(new GlobalExceptionFilter());

  const PORT = process.env.PORT ?? 3000;
  await app.listen(PORT, '0.0.0.0');

  console.log(`🚀 BINUS Marketplace API (NestJS)  →  http://localhost:${PORT}/api`);
  console.log(`📡 Socket.io (WebSocket)           →  port ${PORT}`);
  console.log(`🌿 Environment                     →  ${process.env.NODE_ENV ?? 'development'}`);
}

bootstrap();
