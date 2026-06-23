import {
  ForbiddenException, HttpException, HttpStatus,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Review, ReviewDocument } from './review.schema';
import { Product } from '../products/products.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<Review>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  // ============================================================
  // PRIVATE HELPER: Recalculate product ratings
  //
  // 🔴 FIX: This logic was copy-pasted in create, update, AND remove
  //    Extracted into a single private method (DRY principle).
  //
  // Uses MongoDB aggregation pipeline for efficiency:
  //   $match  → filter reviews for this product only
  //   $group  → calculate average and count in ONE DB call
  //             (instead of fetching all reviews then looping in JS)
  //
  // Also handles the edge case where ALL reviews are deleted:
  //   → resets ratingsAverage to 0 and ratingsQuantity to 0
  // ============================================================
  private async recalculateProductRatings(productId: string): Promise<void> {
    const result = await this.reviewModel.aggregate([
      // Step 1: Only look at reviews for this specific product
      { $match: { product: productId } },

      // Step 2: Group all matching reviews together and calculate stats
      {
        $group: {
          _id: '$product',
          ratingsAverage: { $avg: '$rating' },  // average of all ratings
          ratingsQuantity: { $sum: 1 },          // count of all reviews
        },
      },
    ]);

    if (result.length > 0) {
      // Reviews exist → update product with new calculated values
      await this.productModel.findByIdAndUpdate(productId, {
        // Round to 1 decimal: 4.666 → 4.7
        ratingsAverage: Math.round(result[0].ratingsAverage * 10) / 10,
        ratingsQuantity: result[0].ratingsQuantity,
      });
    } else {
      // ✅ FIX: No reviews left → reset ratings to 0
      // The old code skipped this case, leaving stale rating data
      await this.productModel.findByIdAndUpdate(productId, {
        ratingsAverage: 0,
        ratingsQuantity: 0,
      });
    }
  }

  // ----------------------------------------------------------
  // CREATE REVIEW
  //
  // 🔴 FIX: status was 200, should be 201
  // 🔴 FIX: rating recalculation now uses the helper method
  // ----------------------------------------------------------
  async create(
    createReviewDto: CreateReviewDto,
    userId: string,
  ): Promise<ApiResponse<ReviewDocument>> {

    // Check: one user can only review a product once
    const existingReview = await this.reviewModel.findOne({
      user: userId,
      product: createReviewDto.product,
    });
    if (existingReview) {
      throw new HttpException(
        'You have already reviewed this product',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create the review with the user id from JWT (not from request body)
    const newReview = await (
      await this.reviewModel.create({
        ...createReviewDto,
        user: userId, // ← from JWT token, not user input (security)
      })
    ).populate('product user', 'name email title imageCover');

    // Recalculate product ratings after new review
    await this.recalculateProductRatings(createReviewDto.product);

    return {
      status: HttpStatus.CREATED, // ✅ FIX: 201 not 200
      message: 'Review created successfully',
      data: newReview,
    };
  }

  // ----------------------------------------------------------
  // GET ALL REVIEWS FOR A PRODUCT
  // ----------------------------------------------------------
  async findAll(productId: string): Promise<ApiResponse<ReviewDocument[]>> {
    const reviews = await this.reviewModel
      .find({ product: productId })
      .populate('user', 'name email avatar')
      .select('-__v')
      .sort({ createdAt: -1 }); // newest first

    return {
      status: HttpStatus.OK,
      message: 'Reviews fetched successfully',
      length: reviews.length,
      data: reviews,
    };
  }

  // ----------------------------------------------------------
  // GET ALL REVIEWS BY A USER (Admin Dashboard)
  // ----------------------------------------------------------
  async findOne(userId: string): Promise<ApiResponse<ReviewDocument[]>> {
    const reviews = await this.reviewModel
      .find({ user: userId })
      .populate('user product', 'name email title')
      .select('-__v')
      .sort({ createdAt: -1 });

    return {
      status: HttpStatus.OK,
      message: 'User reviews fetched successfully',
      length: reviews.length,
      data: reviews,
    };
  }

  // ----------------------------------------------------------
  // UPDATE REVIEW
  // Only the owner of the review can update it.
  //
  // 🔴 FIX: Ownership check now throws ForbiddenException (403)
  //    instead of UnauthorizedException (401)
  //    401 = not authenticated
  //    403 = authenticated but not allowed
  //
  // 🔴 FIX: Using the helper for rating recalculation
  // ----------------------------------------------------------
  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    userId: string,
  ): Promise<ApiResponse<ReviewDocument>> {

    const review = await this.reviewModel.findById(id);
    if (!review) {
      throw new NotFoundException(`Review with id "${id}" not found`);
    }

    // Verify the logged-in user owns this review
    if (review.user.toString() !== userId.toString()) {
      throw new ForbiddenException('You can only update your own reviews'); // ✅ 403 not 401
    }

    const updatedReview = await this.reviewModel
      .findByIdAndUpdate(
        id,
        { ...updateReviewDto }, // product cannot be changed (OmitType in DTO)
        { new: true, runValidators: true },
      )
      .select('-__v');

    // Recalculate product ratings after update
    await this.recalculateProductRatings(review.product.toString());

    return {
      status: HttpStatus.OK,
      message: 'Review updated successfully',
      data: updatedReview,
    };
  }

  // ----------------------------------------------------------
  // DELETE REVIEW
  //
  // 🔴 FIX: Was returning void — now returns ApiResponse
  // 🔴 FIX: Now resets ratings to 0 if last review is deleted
  //    (handled inside recalculateProductRatings helper)
  // ----------------------------------------------------------
  async remove(
    id: string,
    userId: string,
  ): Promise<ApiResponse<null>> {

    const review = await this.reviewModel.findById(id);
    if (!review) {
      throw new NotFoundException(`Review with id "${id}" not found`);
    }

    // Verify the logged-in user owns this review
    if (review.user.toString() !== userId.toString()) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    // Save product id BEFORE deleting the review
    // (after deletion, review.product won't be accessible)
    const productId = review.product.toString();

    await this.reviewModel.findByIdAndDelete(id);

    // Recalculate product ratings after deletion
    // If this was the last review, ratings reset to 0
    await this.recalculateProductRatings(productId);

    return {
      status: HttpStatus.OK,
      message: 'Review deleted successfully',
      data: null,
    };
  }
}