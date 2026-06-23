import {
  IsOptional, IsString, IsEnum,
  ValidateNested, IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../orders.schema';

// ============================================================
// SHIPPING ADDRESS DTO
// Nested DTO for the shippingAddress field.
// @ValidateNested + @Type(() => ShippingAddressDto) are needed
// to tell class-validator to validate nested objects too.
// ============================================================
export class ShippingAddressDto {

  @ApiPropertyOptional({ example: '123 Nile Street, Apt 4B' })
  @IsString({ message: 'Details must be a string' })
  @IsOptional()
  details?: string;

  @ApiPropertyOptional({ example: '+201012345678' })
  @IsPhoneNumber('EG', { message: 'Must be a valid Egyptian phone number' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Cairo' })
  @IsString({ message: 'City must be a string' })
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '12345' })
  @IsString({ message: 'Postal code must be a string' })
  @IsOptional()
  postalCode?: string;
}

// ============================================================
// CREATE ORDER DTO
// The body sent when creating a cash order.
// cartId comes from the URL param, not the body.
// shippingAddress is optional — can be stored on user profile.
// ============================================================
export class CreateOrderDto {

  // ----------------------------------------------------------
  // SHIPPING ADDRESS – optional nested object
  // @ValidateNested → validates the nested object's fields
  // @Type(() => ShippingAddressDto) → transforms plain object
  //   into a ShippingAddressDto instance for validation
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    type: ShippingAddressDto,
    description: 'Delivery address for the order',
  })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsOptional()
  shippingAddress?: ShippingAddressDto;

  // ----------------------------------------------------------
  // PAYMENT METHOD – defaults to 'cash' in schema
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    description: 'Payment method: cash or card',
    default: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod, { message: 'Payment method must be "cash" or "card"' })
  @IsOptional()
  paymentMethodType?: PaymentMethod;
}