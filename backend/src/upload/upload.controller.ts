import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
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
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log('Upload request received:', {
      filename: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
    });

    if (!file) {
      throw new BadRequestException('File tidak ada atau ukuran terlalu besar.');
    }

    try {
      const url = await this.uploadService.saveFile(file);
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
