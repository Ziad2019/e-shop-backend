import {
  IsMongoId, IsString,
  MaxLength, MinLength, IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ============================================================
// CREATE SUB CATEGORY DTO
// Validates the request body when creating a new sub-category.
// Both fields are required.
// ============================================================
export class CreateSubCategoryDto {

  // ----------------------------------------------------------
  // NAME – required, 3-30 characters
  // ----------------------------------------------------------
  @ApiProperty({
    example: 'Smartphones',
    description: 'Sub-category name (must be unique, 3-30 characters)',
    minLength: 3,
    maxLength: 30,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3,  { message: 'Name must be at least 3 characters' })
  @MaxLength(30, { message: 'Name must be at most 30 characters' })
  name: string;

  // ----------------------------------------------------------
  // CATEGORY – required parent category ObjectId
  // @IsMongoId validates the format — @IsString is redundant here
  // ----------------------------------------------------------
  @ApiProperty({
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
    description: 'MongoDB ObjectId of the parent category',
  })
  @IsNotEmpty({ message: 'Category ID is required' })
  @IsMongoId({ message: 'Category must be a valid MongoDB ObjectId' })
  category: string;
}