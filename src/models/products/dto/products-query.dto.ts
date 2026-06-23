import {
  IsBoolean, IsEnum, IsMongoId, IsNumber,
  IsOptional, IsString, Max, Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ProductStatus } from '../products.schema';

export enum SortField {
  PRICE      = 'price',
  RATING     = 'ratingsAverage',
  NEWEST     = 'createdAt',
  SOLD       = 'sold',
  VIEWS      = 'views',
  TITLE      = 'title',
}

export class ProductsQueryDto {

  // ── Pagination ─────────────────────────────────
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number) @IsNumber() @Min(1) @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number) @IsNumber() @Min(1) @Max(100) @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: 'title,price,imageCover' })
  @IsString() @IsOptional()
  fields?: string;

  // ── Search & Sort ──────────────────────────────
  @ApiPropertyOptional({ example: 'iphone' })
  @IsString() @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ enum: SortField, example: SortField.NEWEST })
  @IsEnum(SortField) @IsOptional()
  sort?: SortField;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], example: 'desc' })
  @IsEnum(['asc', 'desc']) @IsOptional()
  sortDir?: 'asc' | 'desc';

  // ── Filters ────────────────────────────────────
  @ApiPropertyOptional({ example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @IsMongoId() @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: '64f1a2b3c4d5e6f7a8b9c0d2' })
  @IsMongoId() @IsOptional()
  brand?: string;

  @ApiPropertyOptional({
    example: 'new-arrival',
    enum: ['new-arrival', 'sale', 'trending', 'best-seller', 'limited'],
  })
  @IsString() @IsOptional()
  tag?: string;

  // ── Price Range ────────────────────────────────
  @ApiPropertyOptional({ example: 100 })
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  priceMin?: number;

  @ApiPropertyOptional({ example: 5000 })
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  priceMax?: number;

  // ── Rating Range ───────────────────────────────
  @ApiPropertyOptional({ example: 3 })
  @Type(() => Number) @IsNumber() @Min(0) @Max(5) @IsOptional()
  ratingMin?: number;

  @ApiPropertyOptional({ example: 5 })
  @Type(() => Number) @IsNumber() @Min(0) @Max(5) @IsOptional()
  ratingMax?: number;

  // ── Status & Flags ─────────────────────────────
  @ApiPropertyOptional({ enum: ProductStatus, example: ProductStatus.ACTIVE })
  @IsEnum(ProductStatus) @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean() @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: true, description: 'quantity > 0' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean() @IsOptional()
  inStock?: boolean;

  @ApiPropertyOptional({ example: true, description: 'created in last 30 days' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean() @IsOptional()
  isNewArrival?: boolean;
}