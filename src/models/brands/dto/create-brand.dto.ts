import {
  IsOptional, IsString,
  IsUrl, MaxLength, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================
// CREATE BRAND DTO
// Validates the request body when creating a new brand.
// Only name is required — image is optional.
// ============================================================
export class CreateBrandDto {

  // ----------------------------------------------------------
  // NAME – required, 3-100 characters
  // ----------------------------------------------------------
  @ApiProperty({
    example: 'Nike',
    description: 'Brand name (must be unique)',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @MinLength(3,   { message: 'Name must be at least 3 characters' })
  @MaxLength(100, { message: 'Name must be at most 100 characters' })
  name: string;

  // ----------------------------------------------------------
  // IMAGE – optional, must be a valid URL if provided
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: 'https://example.com/nike-logo.png',
    description: 'URL to the brand logo or image',
  })
  @IsUrl({}, { message: 'Image must be a valid URL' })
  @IsOptional()
  image?: string;
}