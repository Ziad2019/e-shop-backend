import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'

export type WishlistDocument = HydratedDocument<Wishlist>

@Schema({ timestamps: true })
export class Wishlist {

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
    required: true,
  })
  user: mongoose.Types.ObjectId

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    default: [],
  })
  products: mongoose.Types.ObjectId[]
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist)