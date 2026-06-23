import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

import { Category } from '../categories/categories.schema';
import { SubCategory } from '../sub-categories/sub-categories.schema';
import { Brand } from '../brands/brands.schema';



export enum ProductStatus {
  ACTIVE   = 'ACTIVE',
  DRAFT    = 'DRAFT',
  ARCHIVED = 'ARCHIVED',
}


export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {

  @Prop({
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
  })
  title: string;


  @Prop({
    type: String,
    lowercase: true,
    trim: true,
  })
  slug: string;

  @Prop({
    type: String,
    required: [true, 'Product description is required'],
    minlength: [20, 'Description must be at least 20 characters'],
  })
  description: string;

  @Prop({
    type: Number,
    required: [true, 'Product quantity is required'],
    default: 1,
    min: [1, 'Quantity must be at least 1'],
  })
  quantity: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: [true, 'Product cover image is required'],
  })
  imageCover: mongoose.Types.ObjectId;


  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
    default: [],
  })
  images: mongoose.Types.ObjectId[];

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Sold count cannot be negative'],
  })
  sold: number;


  @Prop({
    type: Number,
    required: [true, 'Product price is required'],
    min: [1,     'Price must be at least 1 L.E'],
    max: [50000, 'Price must be at most 50,000 L.E'],
  })
  price: number;

  @Prop({
    type: Number,
    default: 0,
    min: [0,     'Discounted price cannot be negative'],
    max: [50000, 'Discounted price must be at most 50,000 L.E'],
  })
  priceAfterDiscount: number;

  // ----------------------------------------------------------
  // COLOR – available color variants for this product
  // ----------------------------------------------------------
  @Prop({
    type: [String],
    default: [],
  })
  color: string[];


  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Category.name,
    required: [true, 'Product must belong to a category'],
  })
  category: mongoose.Types.ObjectId;


  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: SubCategory.name,
  })
  subCategory: mongoose.Types.ObjectId;


  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Brand.name,
  })
  brand: mongoose.Types.ObjectId;


  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot exceed 5'],
  })
  ratingsAverage: number;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Ratings quantity cannot be negative'],
  })
  ratingsQuantity: number;

    @Prop({
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  @Prop({
    type: Boolean,
    default: false,
  })
  isFeatured: boolean;

  @Prop({
    type: [String],
    default: [],
    enum: ['new-arrival', 'sale', 'trending', 'best-seller', 'limited'],
  })
  tags: string[];

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative'],
  })
  views: number;

  @Prop({
    type: Number,
    default: 5,
    min: [1, 'Threshold must be at least 1'],
  })
  lowStockThreshold: number;
}

// ============================================================
// SCHEMA FACTORY
// ============================================================
export const ProductSchema = SchemaFactory.createForClass(Product);

// Virtual: discount percentage
ProductSchema.virtual('discountPercentage').get(function () {
  if (!this.priceAfterDiscount || this.priceAfterDiscount === 0) return 0;
  return Math.round(((this.price - this.priceAfterDiscount) / this.price) * 100);
});


ProductSchema.set('toJSON',   { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

// ============================================================
// PRE-SAVE HOOK: Auto-generate slug from title
// ============================================================
ProductSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  }
  next();
});