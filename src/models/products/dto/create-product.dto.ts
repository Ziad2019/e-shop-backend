import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  IsNotEmpty,
  MaxLength,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { ProductStatus } from '../products.schema';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'The latest iPhone with A17 Pro chip...' })
  @IsString()
  @MinLength(20)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ example: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  sold?: number;

  @ApiProperty({ example: 45000 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20000)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 39999 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50000)
  @IsOptional()
  priceAfterDiscount?: number;

  @ApiPropertyOptional({ example: ['Black', 'White', 'Gold'] })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v: string) => v.trim())
        .filter(Boolean);
    }
    if (Array.isArray(value)) return value;
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  color?: string[];

  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @IsMongoId()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: '64f1a2b3c4d5e6f7a8b9c0d2' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsMongoId()
  @IsOptional()
  subCategory?: string;

  @ApiPropertyOptional({ example: '64f1a2b3c4d5e6f7a8b9c0d3' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsMongoId()
  @IsOptional()
  brand?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Product cover image (required)',
  })
  @IsOptional() 
  imageCover?: any;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Additional product images (max 10)',
  })
  @IsOptional()
  images?: any;

  @ApiPropertyOptional({ enum: ProductStatus, example: ProductStatus.ACTIVE })
@IsEnum(ProductStatus)
@IsOptional()
status?: ProductStatus;

@ApiPropertyOptional({ example: true })
@Transform(({ value }) => value === 'true' || value === true)
@IsBoolean()
@IsOptional()
isFeatured?: boolean;

@ApiPropertyOptional({ example: ['new-arrival', 'sale'] })
@Transform(({ value }) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
})
@IsArray()
@IsString({ each: true })
@IsOptional()
tags?: string[];
}
