// ============================================================
// UPDATE BRAND DTO
//
// PartialType makes all fields from CreateBrandDto optional,
// so you can update only the fields you want.

import { PartialType } from '@nestjs/swagger';
import { CreateBrandDto } from './create-brand.dto';

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}