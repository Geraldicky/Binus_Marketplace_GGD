// src/listings/dto/listing.dto.ts

import { IsString, IsNumber, IsEnum, IsOptional, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { Category, ListingType, Condition } from '@prisma/client';

export class CreateListingDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Harga harus lebih dari 0.' })
  price: number;

  @IsEnum(Category)
  category: Category;

  @IsEnum(ListingType)
  type: ListingType;

  @IsOptional()
  @IsEnum(Condition)
  condition?: Condition;

  @IsOptional()
  images?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Stok minimal 1.' })
  stock?: number;
}

export class UpdateListingDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) price?: number;
  @IsOptional() @IsEnum(Category) category?: Category;
  @IsOptional() @IsEnum(ListingType) type?: ListingType;
  @IsOptional() @IsEnum(Condition) condition?: Condition;
  @IsOptional() images?: string[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) stock?: number;
}

export class ListingFilterDto {
  @IsOptional() @IsEnum(Category) category?: Category;
  @IsOptional() @IsEnum(ListingType) type?: ListingType;
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @Type(() => Number) @IsNumber() minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() maxPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @Type(() => Number) @IsInt() limit?: number;
}
