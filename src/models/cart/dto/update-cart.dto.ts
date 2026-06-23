import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================
// UPDATE CART ITEMS DTO
// Used when updating the quantity or color of a cart item
// Both fields are optional — you can update one or both
// ============================================================
export class UpdateCartItemsDto {

  // ----------------------------------------------------------
  // QUANTITY – optional, must be at least 1
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: 3,
    description: 'New quantity for the cart item (minimum 1)',
    minimum: 1,
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsOptional()
  quantity?: number;

  // ----------------------------------------------------------
  // COLOR – optional, selected color variant
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: 'Red',
    description: 'Selected color variant of the product',
  })
  @IsString({ message: 'Color must be a string' })
  @IsOptional()
  color?: string;
}

// ============================================================
// APPLY COUPON DTO
// Used when the user wants to apply a discount coupon

export class ApplyCouponDto {

  @ApiProperty({
    example: 'SUMMER20',
    description: 'Coupon code to apply to the cart',
  })
  @IsString({ message: 'Coupon name must be a string' })
  @IsNotEmpty({ message: 'Coupon name is required' })
  name: string;
}