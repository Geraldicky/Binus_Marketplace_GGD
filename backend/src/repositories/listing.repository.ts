// src/repositories/listing.repository.ts
// Semua query database untuk Listing

import { ListingStatus, Category, ListingType } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { CreateListingDto, UpdateListingDto, ListingFilterDto } from '../interfaces/listing.interface';

export class ListingRepository extends BaseRepository {

  // Helper: parse images dari JSON string ke array
  private parseImages(imagesJson: string): string[] {
    try {
      return JSON.parse(imagesJson) as string[];
    } catch {
      return [];
    }
  }

  // Helper: tambahkan parsed images ke listing object
  private withParsedImages<T extends { images: string }>(listing: T) {
    return { ...listing, images: this.parseImages(listing.images) };
  }

  /**
   * Ambil semua listing ACTIVE dengan filter dan pagination
   */
  async findAll(filter: ListingFilterDto) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: 'ACTIVE' };

    if (filter.category) where.category = filter.category;
    if (filter.type) where.type = filter.type;
    if (filter.keyword) {
      where.OR = [
        { title: { contains: filter.keyword } },
        { description: { contains: filter.keyword } },
      ];
    }
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.price = {
        ...(filter.minPrice !== undefined && { gte: filter.minPrice }),
        ...(filter.maxPrice !== undefined && { lte: filter.maxPrice }),
      };
    }

    const [listings, total] = await Promise.all([
      this.db.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: { id: true, name: true, avatarUrl: true, isVerified: true },
          },
        },
      }),
      this.db.listing.count({ where }),
    ]);

    return {
      data: listings.map((l) => this.withParsedImages(l)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Cari listing berdasarkan ID (termasuk info seller)
   */
  async findById(id: string) {
    const listing = await this.db.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, name: true, avatarUrl: true, isVerified: true },
        },
      },
    });
    if (!listing) return null;
    return this.withParsedImages(listing);
  }

  /**
   * Ambil semua listing milik seller tertentu
   */
  async findBySellerId(sellerId: string) {
    const listings = await this.db.listing.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });
    return listings.map((l) => this.withParsedImages(l));
  }

  /**
   * Buat listing baru (status PENDING)
   */
  async create(sellerId: string, data: CreateListingDto) {
    const listing = await this.db.listing.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        type: data.type,
        condition: data.condition ?? null,
        images: JSON.stringify(data.images ?? []),
        status: 'PENDING',
        sellerId,
      },
    });
    return this.withParsedImages(listing);
  }

  /**
   * Update listing (kembali ke PENDING jika sebelumnya ACTIVE)
   */
  async update(id: string, data: UpdateListingDto, currentStatus: ListingStatus) {
    const newStatus: ListingStatus =
      currentStatus === 'ACTIVE' ? 'PENDING' : currentStatus;

    const listing = await this.db.listing.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.category && { category: data.category }),
        ...(data.type && { type: data.type }),
        ...(data.condition !== undefined && { condition: data.condition }),
        ...(data.images !== undefined && { images: JSON.stringify(data.images) }),
        status: newStatus,
      },
    });
    return this.withParsedImages(listing);
  }

  /**
   * Soft delete: ubah status ke INACTIVE
   */
  async softDelete(id: string) {
    return this.db.listing.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  /**
   * Ubah status listing ke SOLD
   */
  async markAsSold(id: string) {
    return this.db.listing.update({
      where: { id },
      data: { status: 'SOLD' },
    });
  }

  // ── Admin ──────────────────────────────────

  /**
   * Ambil semua listing yang PENDING (untuk moderasi admin)
   */
  async findPending() {
    const listings = await this.db.listing.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: {
        seller: {
          select: { id: true, name: true, email: true, studentId: true },
        },
      },
    });
    return listings.map((l) => this.withParsedImages(l));
  }

  /**
   * Admin: approve atau reject listing
   */
  async moderate(id: string, action: 'approve' | 'reject') {
    const newStatus: ListingStatus = action === 'approve' ? 'ACTIVE' : 'REJECTED';
    return this.db.listing.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  /**
   * Hitung listing berdasarkan status (untuk dashboard)
   */
  async countByStatus(status: ListingStatus): Promise<number> {
    return this.db.listing.count({ where: { status } });
  }
}
