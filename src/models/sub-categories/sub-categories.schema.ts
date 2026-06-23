import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Category } from '../categories/categories.schema';

// ============================================================
// SUB CATEGORY DOCUMENT TYPE
// ============================================================
export type SubCategoryDocument = HydratedDocument<SubCategory>;

// ============================================================
// SUB CATEGORY SCHEMA
// Represents a sub-category that belongs to a parent Category.
// Example: Category = "Electronics" → SubCategory = "Phones"
//
// 🔴 BUG FIX: @Schema() was missing timestamps: true
//    Added timestamps so createdAt and updatedAt are tracked
// ============================================================
@Schema({ timestamps: true }) // ✅ FIXED: added timestamps
export class SubCategory {

  // ----------------------------------------------------------
  // NAME – required, unique sub-category name
  // NOTE: use minlength/maxlength for strings (not min/max)
  //       min/max only work for Number fields in Mongoose
  // ----------------------------------------------------------
  @Prop({
    type: String,
    required: [true, 'Sub-category name is required'],
    unique: true,
    trim: true,
    minlength: [3,  'Name must be at least 3 characters'], // ✅ FIXED
    maxlength: [30, 'Name must be at most 30 characters'], // ✅ FIXED
  })
  name: string;

  // ----------------------------------------------------------
  // SLUG – URL-friendly version of the name
  // Auto-generated from name via pre-save hook
  // ----------------------------------------------------------
  @Prop({
    type: String,
    lowercase: true,
    trim: true,
  })
  slug: string;

  // ----------------------------------------------------------
  // CATEGORY – the parent category this sub-category belongs to
  // required: true → every sub-category must have a parent
  // ----------------------------------------------------------
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Category.name,
    required: [true, 'Sub-category must belong to a parent category'],
  })
  category: mongoose.Types.ObjectId;
}

// ============================================================
// SCHEMA FACTORY
// ============================================================
export const SubCategorySchema = SchemaFactory.createForClass(SubCategory);

// ============================================================
// PRE-SAVE HOOK: Auto-generate slug from name
// ============================================================
SubCategorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')     // spaces → hyphens
      .replace(/[^\w-]+/g, '')  // remove special characters
      .replace(/--+/g, '-');    // multiple hyphens → single
  }
  next();
});