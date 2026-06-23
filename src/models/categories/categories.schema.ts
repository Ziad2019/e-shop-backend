import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { Image } from '../uploads/image.schema'

export type CategoryDocument = HydratedDocument<Category>

@Schema({ timestamps: true })
export class Category {

  @Prop({
    type:      String,
    required:  [true, 'Category name is required'],
    unique:    true,
    trim:      true,
    minlength: [3,  'Name must be at least 3 characters'],
    maxlength: [30, 'Name must be at most 30 characters'],
  })
  name: string

  @Prop({ type: String, lowercase: true, trim: true })
  slug: string

@Prop({
  type: mongoose.Schema.Types.Mixed,
  ref: 'Image',
})
image: Image | string
}

export const CategorySchema = SchemaFactory.createForClass(Category)

CategorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
  }
  next()
})