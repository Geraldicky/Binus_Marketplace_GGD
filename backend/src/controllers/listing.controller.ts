// src/controllers/listing.controller.ts

import { Request, Response } from 'express';
import { ListingService } from '../services/listing.service';
import { ResponseHelper } from '../lib/response';
import { AuthenticatedRequest } from '../interfaces/auth.interface';
import { Category, ListingType, Condition } from '@prisma/client';

export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  /** GET /api/listings */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, type, keyword, minPrice, maxPrice, page, limit } = req.query;

      const result = await this.listingService.getAll({
        category: category as Category | undefined,
        type: type as ListingType | undefined,
        keyword: keyword as string | undefined,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      ResponseHelper.paginated(res, result.data, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      ResponseHelper.error(res, message);
    }
  };

  /** GET /api/listings/my/listings */
  getMyListings = async (req: Request, res: Response): Promise<void> => {
    try {
      const sellerId = (req as AuthenticatedRequest).user.id;
      const listings = await this.listingService.getMyListings(sellerId);
      ResponseHelper.success(res, listings);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      ResponseHelper.error(res, message);
    }
  };

  /** GET /api/listings/:id */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const listing = await this.listingService.getById(req.params.id);
      ResponseHelper.success(res, listing);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      ResponseHelper.error(res, message, message.includes('tidak ditemukan') ? 404 : 500);
    }
  };

  /** POST /api/listings */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const sellerId = (req as AuthenticatedRequest).user.id;
      const { title, description, price, category, type, condition, images } = req.body;

      if (!title || !description || !price || !category || !type) {
        ResponseHelper.badRequest(res, 'Title, deskripsi, harga, kategori, dan tipe wajib diisi.');
        return;
      }

      const listing = await this.listingService.create(sellerId, {
        title,
        description,
        price: parseFloat(price),
        category: category as Category,
        type: type as ListingType,
        condition: condition as Condition | undefined,
        images: images ?? [],
      });

      ResponseHelper.created(res, listing, 'Listing berhasil dibuat dan sedang menunggu persetujuan admin.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      ResponseHelper.error(res, message, 400);
    }
  };

  /** PUT /api/listings/:id */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const sellerId = (req as AuthenticatedRequest).user.id;
      const { title, description, price, category, type, condition, images } = req.body;

      const listing = await this.listingService.update(req.params.id, sellerId, {
        title,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        category: category as Category | undefined,
        type: type as ListingType | undefined,
        condition: condition as Condition | undefined,
        images,
      });

      ResponseHelper.success(res, listing, 'Listing diperbarui. Menunggu persetujuan admin kembali.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      const code = message.includes('tidak ditemukan') ? 404
        : message.includes('tidak berhak') ? 403 : 400;
      ResponseHelper.error(res, message, code);
    }
  };

  /** DELETE /api/listings/:id */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const sellerId = (req as AuthenticatedRequest).user.id;
      await this.listingService.delete(req.params.id, sellerId);
      ResponseHelper.success(res, null, 'Listing berhasil dihapus.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      const code = message.includes('tidak ditemukan') ? 404
        : message.includes('tidak berhak') ? 403 : 400;
      ResponseHelper.error(res, message, code);
    }
  };
}
