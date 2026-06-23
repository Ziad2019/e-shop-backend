import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// ============================================================
// COUPON DOCUMENT TYPE
// HydratedDocument<Coupon> adds Mongoose instance methods
// like .save(), .populate() to the Coupon class
// ============================================================
export type CouponDocument = HydratedDocument<Coupon>;

// ============================================================
// COUPON SCHEMA
// Represents a discount coupon that users can apply to their cart
// Each coupon has a name (code), expiry date, and discount %
// timestamps: true → adds createdAt and updatedAt automatically
// ============================================================
@Schema({ timestamps: true })
export class Coupon {

  // ----------------------------------------------------------
  // NAME – the coupon code users type in (e.g., "SUMMER20")
  // unique: true → no two coupons with the same code
  // uppercase: true → store as uppercase for consistent lookup
  // NOTE: use minlength/maxlength for strings (not min/max)
  //       min/max only work for Number fields in Mongoose
  // ----------------------------------------------------------
  @Prop({
    type: String,
    required: [true, 'Coupon name is required'],
    unique: true,
    trim: true,
    uppercase: true, // SUMMER20 and summer20 are treated the same
    minlength: [3,   'Name must be at least 3 characters'],
    maxlength: [100, 'Name must be at most 100 characters'],
  })
  name: string;

  // ----------------------------------------------------------
  // EXPIRE DATE – when the coupon can no longer be used
  // Stored as a Date object in MongoDB
  // Validated in the service to ensure it's a future date
  // ----------------------------------------------------------
  @Prop({
    type: Date,
    required: [true, 'Expire date is required'],
  })
  expireDate: Date;

  // ----------------------------------------------------------
  // DISCOUNT – percentage off the total cart price
  // Must be between 1 and 100 (a percentage)
  // Example: 20 means 20% off
  // ----------------------------------------------------------
  @Prop({
    type: Number,
    required: [true, 'Discount value is required'],
    min: [1,   'Discount must be at least 1%'],
    max: [100, 'Discount cannot exceed 100%'],
  })
  discount: number;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);