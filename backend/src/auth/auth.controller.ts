// src/auth/auth.controller.ts
// =============================================
// Controller NestJS vs Express:
//
// Express:
//   router.post('/register', authController.register)
//   const { email } = req.body  // manual extract
//
// NestJS:
//   @Post('register')           // decorator langsung di method
//   register(@Body() dto)       // otomatis di-parse & divalidasi
// =============================================

import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')  // Prefix: /api/auth
export class AuthController {
  // Dependency Injection otomatis oleh NestJS
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    // @Body() otomatis parse + validasi dengan class-validator
    // Tidak perlu cek manual if (!email || !password)
    const result = await this.authService.register(dto);
    return {
      success: true,
      message: 'Registrasi berhasil! Selamat datang di BINUS Marketplace.',
      data: result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      success: true,
      message: `Selamat datang kembali, ${result.user.name}!`,
      data: result,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)  // Proteksi endpoint, menggantikan authenticate middleware
  async getMe(@CurrentUser() user: any) {
    const result = await this.authService.getMe(user.id);
    return { success: true, data: result };
  }
}
