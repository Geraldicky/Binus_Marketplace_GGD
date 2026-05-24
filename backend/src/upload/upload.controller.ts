import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Request } from 'express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    console.log('Upload request received:', {
      filename: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
    });

    if (!file) {
      throw new BadRequestException('File tidak ada atau ukuran terlalu besar.');
    }

    try {
      const url = await this.uploadService.saveFile(file, req);
      return {
        success: true,
        message: 'File berhasil diupload.',
        url,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new BadRequestException(error.message || 'Gagal upload file');
    }
  }
}
