import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateReviewDto } from './create-review.dto';

// ============================================================
// UPDATE REVIEW DTO
//
// OmitType → removes 'product' field from updates
// You shouldn't be able to change WHICH product a review belongs to.
// Only reviewText and rating should be updatable.
//
// PartialType → makes remaining fields optional
//
// Import from '@nestjs/swagger' to preserve @ApiProperty() in Swagger UI
// ============================================================
export class UpdateReviewDto extends PartialType(
  OmitType(CreateReviewDto, ['product'] as const),
) {}