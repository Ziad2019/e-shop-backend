import { PartialType } from '@nestjs/swagger';
import { CreateTaxDto } from './create-tax.dto';

// ============================================================
// UPDATE TAX DTO
//
// PartialType makes all fields optional (they already are in
// CreateTaxDto, but this follows the NestJS convention).
//
// 🟡 FIX: Import from '@nestjs/swagger' not '@nestjs/mapped-types'
//    to preserve @ApiProperty() decorators in Swagger UI
// ============================================================
export class UpdateTaxDto extends PartialType(CreateTaxDto) {}