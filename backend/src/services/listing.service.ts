// src/services/listing.service.ts
// Business logic untuk Listing

import { ListingRepository } from '../repositories/listing.repository';
import {
  CreateListingDto,
  UpdateListingDto,
  ListingFilterDto,
} from '../interfaces/listing.interface';

export class ListingService {
  constructor(private readonly listingRepository: ListingRepository) {}

  /**
   * Browse semua listing yang aktif
   */
  async getAll(filter: ListingFilterDto) {
    return this.listingRepository.findAll(filter);
  }

  /**
   * Detail satu listing
   * Business rule: Listing harus ada
   */
  async getById(id: string) {
    const listing = await this.listingRepository.findById(id);
    if (!listing) throw new Error('Listing tidak ditemukan.');
    return listing;
  }

  /**
   * Listing milik seller yang sedang login
   */
  async getMyListings(sellerId: string) {
    return this.listingRepository.findBySellerId(sellerId);
  }

  /**
   * Buat listing baru
   * Business rules:
   * - Harga harus lebih dari 0
   * - Listing langsung berstatus PENDING (butuh moderasi admin)
   */
  async create(sellerId: string, data: CreateListingDto) {
    if (data.price <= 0) {
      throw new Error('Harga harus lebih dari 0.');
    }
    return this.listingRepository.create(sellerId, data);
  }

  /**
   * Update listing
   * Business rules:
   * - Hanya pemilik yang boleh edit
   * - Listing SOLD atau REJECTED tidak bisa diedit
   * - Jika berhasil diedit, kembali ke status PENDING
   */
  async update(id: string, sellerId: string, data: UpdateListingDto) {
    const listing = await this.listingRepository.findById(id);
    if (!listing) throw new Error('Listing tidak ditemukan.');

    if (listing.sellerId !== sellerId) {
      throw new Error('Anda tidak berhak mengedit listing ini.');
    }

    if (['SOLD', 'REJECTED'].includes(listing.status)) {
      throw new Error('Listing yang sudah terjual atau ditolak tidak dapat diedit.');
    }

    if (data.price !== undefined && data.price <= 0) {
      throw new Error('Harga harus lebih dari 0.');
    }

    return this.listingRepository.update(id, data, listing.status);
  }

  /**
   * Hapus listing (soft delete)
   * Business rule: Hanya pemilik yang boleh hapus
   */
  async delete(id: string, sellerId: string) {
    const listing = await this.listingRepository.findById(id);
    if (!listing) throw new Error('Listing tidak ditemukan.');

    if (listing.sellerId !== sellerId) {
      throw new Error('Anda tidak berhak menghapus listing ini.');
    }

    return this.listingRepository.softDelete(id);
  }

  // ── Admin ──────────────────────────────────

  async getPending() {
    return this.listingRepository.findPending();
  }

  /**
   * Admin: approve atau reject listing
   */
  async moderate(id: string, action: 'approve' | 'reject') {
    const listing = await this.listingRepository.findById(id);
    if (!listing) throw new Error('Listing tidak ditemukan.');
    return this.listingRepository.moderate(id, action);
  }
}
