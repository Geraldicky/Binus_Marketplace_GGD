// src/listings/listings.service.ts

import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto, UpdateListingDto, ListingFilterDto } from './dto/listing.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  // ── Helper ────────────────────────────────
  private parseImages(raw: string): string[] {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }

  private withParsedImages<T extends { images: string }>(listing: T) {
    return { ...listing, images: this.parseImages(listing.images) };
  }

  // ── Public methods ────────────────────────

  async findAll(filter: ListingFilterDto) {
    const page  = filter.page  ?? 1;
    const limit = filter.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: any = { status: 'ACTIVE' };
    if (filter.category) where.category = filter.category;
    if (filter.type)     where.type     = filter.type;
    if (filter.keyword)  where.OR = [
      { title:       { contains: filter.keyword } },
      { description: { contains: filter.keyword } },
    ];
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.price = {};
      if (filter.minPrice !== undefined) where.price.gte = filter.minPrice;
      if (filter.maxPrice !== undefined) where.price.lte = filter.maxPrice;
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: { select: { id: true, name: true, avatarUrl: true, isVerified: true } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: listings.map(l => this.withParsedImages(l)),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, avatarUrl: true, isVerified: true } },
      },
    });
    if (!listing) throw new NotFoundException('Listing tidak ditemukan.');
    return this.withParsedImages(listing);
  }

  async findMySellListings(sellerId: string) {
    const listings = await this.prisma.listing.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });
    return listings.map(l => this.withParsedImages(l));
  }

  async create(sellerId: string, dto: CreateListingDto) {
    const stockLeft = dto.type === 'PRODUCT' && dto.stock ? dto.stock : null;
    const listing = await this.prisma.listing.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        category: dto.category,
        type: dto.type,
        condition: dto.condition ?? null,
        images: JSON.stringify(dto.images ?? []),
        status: 'PENDING',
        sellerId,
        stock:     dto.type === 'PRODUCT' ? (dto.stock ?? null) : null,
        stockLeft,
      },
    });
    return this.withParsedImages(listing);
  }

  async update(id: string, sellerId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing tidak ditemukan.');
    if (listing.sellerId !== sellerId) throw new ForbiddenException('Anda tidak berhak mengedit listing ini.');
    if (['SOLD', 'REJECTED'].includes(listing.status)) {
      throw new BadRequestException('Listing yang sudah terjual atau ditolak tidak dapat diedit.');
    }

    const stockUpdate = dto.stock !== undefined
      ? { stock: dto.stock, stockLeft: dto.stock }
      : {};

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        ...(dto.title       && { title:       dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.price       !== undefined && { price: dto.price }),
        ...(dto.category    && { category:    dto.category }),
        ...(dto.type        && { type:        dto.type }),
        ...(dto.condition   !== undefined && { condition: dto.condition }),
        ...(dto.images      !== undefined && { images: JSON.stringify(dto.images) }),
        ...stockUpdate,
        status: listing.status === 'ACTIVE' ? 'PENDING' : listing.status,
      },
    });
    return this.withParsedImages(updated);
  }

  async softDelete(id: string, sellerId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing tidak ditemukan.');
    if (listing.sellerId !== sellerId) throw new ForbiddenException('Anda tidak berhak menghapus listing ini.');
    return this.prisma.listing.update({ where: { id }, data: { status: 'INACTIVE' } });
  }

  async decrementStock(id: string, qty: number) {
    await this.prisma.listing.update({ where: { id }, data: { stockLeft: { decrement: qty } } });
  }

  async incrementStock(id: string, qty: number) {
    await this.prisma.listing.update({ where: { id }, data: { stockLeft: { increment: qty } } });
  }

  async markAsSold(id: string) {
    await this.prisma.listing.update({ where: { id }, data: { status: 'SOLD' } });
  }

  // ── Admin ──────────────────────────────────

  async findPending() {
    const listings = await this.prisma.listing.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: {
        seller: { select: { id: true, name: true, email: true, studentId: true, avatarUrl: true, isVerified: true } },
      },
    });
    return listings.map(l => this.withParsedImages(l));
  }

  async moderate(id: string, action: 'approve' | 'reject') {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing tidak ditemukan.');
    const newStatus: ListingStatus = action === 'approve' ? 'ACTIVE' : 'REJECTED';
    return this.prisma.listing.update({ where: { id }, data: { status: newStatus } });
  }

  async countByStatus(status: ListingStatus): Promise<number> {
    return this.prisma.listing.count({ where: { status } });
  }
}
