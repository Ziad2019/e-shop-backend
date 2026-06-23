import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


// ============================================================
export type ImageDocument = HydratedDocument<Image>;

// ============================================================
// IMAGE SCHEMA
// Stores metadata for images uploaded to Cloudinary.
// Each image document holds:
//   - The original image URL + publicId (for deletion)
//   - Pre-generated URLs for different sizes (thumbnail/medium/large)
//   - Technical metadata (format, dimensions, file size)
//   - Optional alt text and custom metadata
//
// Other schemas (Product, Category etc.) reference Image documents
// via ObjectId instead of storing URLs directly — this allows
// updating image metadata without touching every product.
// ============================================================
@Schema({ timestamps: true })
export class Image {

  // ----------------------------------------------------------
  // URL – the main Cloudinary URL for the original image
  // ----------------------------------------------------------
  @Prop({
    type: String,
    required: [true, 'Image URL is required'],
  })
  url: string;

  // ----------------------------------------------------------
  // PUBLIC ID – Cloudinary's identifier for this image
  // Required for deletion and URL generation transformations
  // ----------------------------------------------------------
  @Prop({
    type: String,
    required: [true, 'Cloudinary public ID is required'],
    unique: true, // each Cloudinary image has a unique publicId
  })
  publicId: string;

  // ----------------------------------------------------------
  // SIZE VARIANTS – pre-generated Cloudinary transformation URLs
  // Generated at upload time so we don't compute them on every request
  //   thumbnail → 200×200  (product thumbnails, avatars)
  //   medium    → 600×600  (product grid, category cards)
  //   large     → 1200×1200 (product detail page)
  // ----------------------------------------------------------
  @Prop({ type: String })
  thumbnailUrl: string;

  @Prop({ type: String })
  mediumUrl: string;

  @Prop({ type: String })
  largeUrl: string;

  // ----------------------------------------------------------
  // TECHNICAL METADATA – from Cloudinary upload response
  // ----------------------------------------------------------
  @Prop({
    type: String,
    required: [true, 'Image format is required'],
  })
  format: string; // 'jpg', 'png', 'webp' etc.

  @Prop({
    type: Number,
    required: [true, 'Image width is required'],
    min: [1, 'Width must be positive'],
  })
  width: number; // in pixels

  @Prop({
    type: Number,
    required: [true, 'Image height is required'],
    min: [1, 'Height must be positive'],
  })
  height: number; // in pixels

  @Prop({
    type: Number,
    required: [true, 'Image file size is required'],
    min: [0, 'File size cannot be negative'],
  })
  bytes: number; // file size in bytes

  // ----------------------------------------------------------
  // ALT TEXT – accessibility description for screen readers
  // Should describe the image content
  // ----------------------------------------------------------
  @Prop({ type: String, default: '' })
  alt: string;

  // ----------------------------------------------------------
  // METADATA – any additional custom key-value data
  // Flexible field for future extensions
  // ----------------------------------------------------------
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const ImageSchema = SchemaFactory.createForClass(Image);