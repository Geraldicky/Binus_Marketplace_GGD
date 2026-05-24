import { Injectable, BadRequestException } from '@nestjs/common';
import { Express } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient | null = null;
  private bucketName = 'marketplace-images';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
      } catch (error) {
        console.warn('⚠️  Failed to initialize Supabase client:', error.message);
        this.supabase = null;
      }
    } else {
      console.warn('⚠️  Supabase credentials not configured. Image uploads will be disabled.');
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    if (!this.supabase) {
      throw new BadRequestException(
        'Upload service tidak tersedia. Admin perlu configure Supabase credentials di Railway.'
      );
    }

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
      // Generate unique filename
      const timestamp = Date.now();
      const random = randomBytes(8).toString('hex');
      const ext = file.originalname.split('.').pop();
      const filename = `${timestamp}-${random}.${ext}`;
      const filepath = `images/${filename}`;

      // Upload ke Supabase Storage
      const { error, data } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filepath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new BadRequestException(`Gagal upload file: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filepath);

      if (!publicUrlData?.publicUrl) {
        throw new BadRequestException('Gagal menghasilkan URL publik.');
      }

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Gagal menyimpan file: ${error.message}`);
    }
  }
}
