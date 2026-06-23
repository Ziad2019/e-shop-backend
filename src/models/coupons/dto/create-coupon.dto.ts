import {
  IsDateString, IsNumber, IsString,
  MaxLength, Max, Min, MinLength, IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ============================================================
// CREATE COUPON DTO
// Validates the request body when creating a new coupon.
// All three fields are required.
// ============================================================
export class CreateCouponDto {

  // ----------------------------------------------------------
  // NAME – the coupon code (e.g., "SUMMER20")
  // Will be stored in uppercase by the schema
  // ----------------------------------------------------------
  @ApiProperty({
    example: 'SUMMER20',
    description: 'Unique coupon code (3-100 characters)',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Coupon name is required' })
  @MinLength(3,   { message: 'Name must be at least 3 characters' })
  @MaxLength(100, { message: 'Name must be at most 100 characters' })
  name: string;

  // ----------------------------------------------------------
  // EXPIRE DATE – must be a valid ISO 8601 date string
  // The service validates that it's in the future
  // Format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ
  // ----------------------------------------------------------
  @ApiProperty({
    example: '2026-12-31',
    description: 'Expiry date in ISO format (YYYY-MM-DD). Must be a future date.',
  })
  @IsNotEmpty({ message: 'Expire date is required' })
  @IsDateString({}, {
    message: 'expireDate must be a valid date string (e.g., 2026-12-31)',
  })
  expireDate: string;

  // ----------------------------------------------------------
  // DISCOUNT – percentage off the cart total (1-100)
  // Added @Max(100) to prevent invalid values like 200%
  // ----------------------------------------------------------
  @ApiProperty({
    example: 20,
    description: 'Discount percentage (1–100)',
    minimum: 1,
    maximum: 100,
  })
  @IsNumber({}, { message: 'Discount must be a number' })
  @Min(1,   { message: 'Discount must be at least 1%' })
  @Max(100, { message: 'Discount cannot exceed 100%' })
  discount: number;
}