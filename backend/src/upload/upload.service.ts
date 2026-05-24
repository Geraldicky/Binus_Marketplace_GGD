import { Injectable, BadRequestException } from '@nestjs/common';
import { Express, Request } from 'express';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class UploadService {
  private uploadDir = join(process.cwd(), 'uploads');

  async saveFile(file: Express.Multer.File, req: Request): Promise<string> {
    if (!file) {
      throw new BadRequestException('File tidak ada.');
    }

    // Validasi ukuran file (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Ukuran file terlalu besar. Maksimal 5MB.');
    }

    // Validasi tipe file
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Tipe file tidak didukung. Hanya JPG, PNG, WEBP, atau GIF.');
    }

    try {
      // Buat direktori uploads jika belum ada
      await fs.mkdir(this.uploadDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const random = randomBytes(8).toString('hex');
      const ext = file.originalname.split('.').pop();
      const filename = `${timestamp}-${random}.${ext}`;

      // Simpan file
      const filePath = join(this.uploadDir, filename);
      await fs.writeFile(filePath, file.buffer);

      // Build base URL dari request origin atau host
      let baseUrl = process.env.FILE_URL;
      if (!baseUrl) {
        // Get protocol and host dari request
        const protocol = req.protocol || 'https';
        const host = req.get('host') || 'localhost:3000';
        baseUrl = `${protocol}://${host}`;
      }
      
      return `${baseUrl}/uploads/${filename}`;
    } catch (error) {
      throw new BadRequestException(`Gagal menyimpan file: ${error.message}`);
    }
  }
}
