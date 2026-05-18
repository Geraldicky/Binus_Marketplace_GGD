// src/interfaces/listing.interface.ts

import { Category, Condition, ListingType, ListingStatus } from '@prisma/client';

export interface CreateListingDto {
  title: string;
  description: string;
  price: number;
  category: Category;
  type: ListingType;
  condition?: Condition;
  images?: string[];
}

export interface UpdateListingDto {
  title?: string;
  description?: string;
  price?: number;
  category?: Category;
  type?: ListingType;
  condition?: Condition;
  images?: string[];
}

export interface ListingFilterDto {
  category?: Category;
  type?: ListingType;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface ListingWithSeller {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  type: ListingType;
  images: string[];       // Sudah di-parse dari JSON string
  status: ListingStatus;
  condition: Condition | null;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
  seller?: {
    id: string;
    name: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
}
