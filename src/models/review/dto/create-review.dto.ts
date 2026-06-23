import {
  IsMongoId, IsNumber, IsOptional,
  IsString, Max, Min, MinLength, IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================
// CREATE REVIEW DTO
// Validates the request body when creating a new review.
// The 'user' field is NOT here — it comes from req.user (JWT token)
// ============================================================
export class CreateReviewDto {

  // ----------------------------------------------------------
  // REVIEW TEXT – optional written comment
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: 'Great product! Very satisfied with the quality.',
    description: 'Optional written review (min 3 characters)',
  })
  @IsString({ message: 'Review text must be a string' })
  @MinLength(3, { message: 'Review text must be at least 3 characters' })
  @IsOptional()
  reviewText?: string;

  // ----------------------------------------------------------
  // RATING – required, between 1 and 5 stars
  // 🔴 FIX: @Max(5) message was saying "Min 5 star" — fixed to "Max 5"
  // ----------------------------------------------------------
  @ApiProperty({
    example: 4,
    description: 'Star rating from 1 to 5',
    minimum: 1,
    maximum: 5,
  })
  @IsNotEmpty({ message: 'Rating is required' })
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(1, { message: 'Rating must be at least 1 star' })
  @Max(5, { message: 'Rating cannot exceed 5 stars' }) // ✅ FIXED message
  rating: number;

  // ----------------------------------------------------------
  // PRODUCT – which product this review is for
  // ----------------------------------------------------------
  @ApiProperty({
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
    description: 'MongoDB ObjectId of the product being reviewed',
  })
  @IsNotEmpty({ message: 'Product ID is required' })
  @IsMongoId({ message: 'Product must be a valid MongoDB ObjectId' })
  product: string;
}