import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

import { User } from '../users/users.schema';
import { Product } from '../products/products.schema';

// ============================================================
// REVIEW DOCUMENT TYPE
// ============================================================
export type ReviewDocument = HydratedDocument<Review>;

// ============================================================
// REVIEW SCHEMA
// Represents a user review on a product.
// Each user can leave ONLY ONE review per product
// (enforced via compound unique index below).
//
// After every create/update/delete, the product's
// ratingsAverage and ratingsQuantity are recalculated.
// ============================================================
@Schema({ timestamps: true })
export class Review {

  // ----------------------------------------------------------
  // REVIEW TEXT – optional written review
  // NOTE: use minlength for strings (not min — that's for Numbers)
  // ----------------------------------------------------------
  @Prop({
    type: String,
    minlength: [3, 'Review text must be at least 3 characters'],
    trim: true,
  })
  reviewText: string;

  // ----------------------------------------------------------
  // RATING – required star rating between 1 and 5
  // ----------------------------------------------------------
  @Prop({
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1 star'],
    max: [5, 'Rating cannot exceed 5 stars'],
  })
  rating: number;

  // ----------------------------------------------------------
  // USER – who wrote the review
  // required: true → every review must belong to a user
  // ----------------------------------------------------------
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: [true, 'Review must belong to a user'],
  })
  user: mongoose.Types.ObjectId;

  // ----------------------------------------------------------
  // PRODUCT – which product is being reviewed
  // ----------------------------------------------------------
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Product.name,
    required: [true, 'Review must belong to a product'],
  })
  product: mongoose.Types.ObjectId;
}

// ============================================================
// SCHEMA FACTORY
// ============================================================
export const ReviewSchema = SchemaFactory.createForClass(Review);

// ============================================================
// COMPOUND UNIQUE INDEX
// Ensures one user can only leave ONE review per product.
// Attempting to create a second review throws a duplicate key error.
//
// This is enforced at the DATABASE level (stronger than service check)
// ============================================================
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });