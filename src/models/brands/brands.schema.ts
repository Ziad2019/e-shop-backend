import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// ============================================================
// BRAND DOCUMENT TYPE
// HydratedDocument<Brand> adds Mongoose instance methods like
// .save(), .remove(), .populate() to the Brand class
// ============================================================
export type BrandDocument = HydratedDocument<Brand>;

// ============================================================
// BRAND SCHEMA
// Represents a product brand (e.g., Nike, Apple, Samsung)
// timestamps: true → adds createdAt and updatedAt automatically
// ============================================================
@Schema({ timestamps: true })
export class Brand {

  @Prop({
    type: String,
    required: [true, 'Brand name is required'],
    unique: true,
    trim: true,
    minlength: [3,   'Name must be at least 3 characters'],
    maxlength: [100, 'Name must be at most 100 characters'],
  })
  name: string;

  // ----------------------------------------------------------
  // SLUG – URL-friendly version of the brand name
  // Generated automatically from name in the pre-save hook
  // Example: "Nike Air" → "nike-air"
  // Used in frontend URLs: /brands/nike-air
  // ----------------------------------------------------------
  @Prop({
    type: String,
    lowercase: true,
    trim: true,
  })
  slug: string;

  // ----------------------------------------------------------
  // IMAGE – optional URL to brand logo/image
  // ----------------------------------------------------------
  @Prop({ type: String })
  image: string;
}

// ============================================================
// SCHEMA FACTORY
// Converts the Brand class with @Prop() decorators into
// a real Mongoose Schema that MongoDB understands
// ============================================================
export const BrandSchema = SchemaFactory.createForClass(Brand);

// ============================================================
// PRE-SAVE HOOK: Auto-generate slug from name
// Runs every time a brand document is saved
//
// 'this' refers to the document being saved
// (don't use arrow functions — 'this' would be undefined)
// ============================================================
BrandSchema.pre('save', function (next) {
  // Only regenerate slug if name was changed
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')    // replace spaces with hyphens
      .replace(/[^\w-]+/g, '') // remove special characters
      .replace(/--+/g, '-');   // replace multiple hyphens with single
  }
  next();
});