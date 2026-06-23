import { PartialType } from '@nestjs/swagger';
import { CreateSubCategoryDto } from './create-sub-category.dto';

// ============================================================
// UPDATE SUB CATEGORY DTO
//
// PartialType makes all fields from CreateSubCategoryDto optional
// so you can update just the name, just the category, or both.
//
// 🟡 FIX: Import from '@nestjs/swagger' NOT '@nestjs/mapped-types'
//    The swagger version preserves @ApiProperty() in Swagger UI
// ============================================================
export class UpdateSubCategoryDto extends PartialType(CreateSubCategoryDto) {}