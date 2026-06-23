import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================
// CREATE TAX DTO
// Used for both creating and updating the tax configuration.
// Both fields are optional — you can update just one of them.
//
// Note: This module uses a singleton pattern — there's always
// only ONE tax document. POST creates it if missing, updates if exists.
// ============================================================
export class CreateTaxDto {

  // ----------------------------------------------------------
  // TAX PRICE – must be a non-negative number
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: 15,
    description: 'Tax amount added to each order (must be >= 0)',
    default: 0,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Tax price must be a number' })
  @Min(0, { message: 'Tax price cannot be negative' })
  @IsOptional()
  taxPrice?: number;

  // ----------------------------------------------------------
  // SHIPPING PRICE – must be a non-negative number
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: 30,
    description: 'Flat shipping fee added to each order (must be >= 0)',
    default: 0,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Shipping price must be a number' })
  @Min(0, { message: 'Shipping price cannot be negative' })
  @IsOptional()
  shippingPrice?: number;
}