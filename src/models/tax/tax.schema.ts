import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// ============================================================
// TAX DOCUMENT TYPE
// 🔴 TYPO FIX: 'texDocument' → 'TaxDocument'
// ============================================================
export type TaxDocument = HydratedDocument<Tax>;

// ============================================================
// TAX SCHEMA
// This is a SINGLETON document — only ONE tax record exists
// in the entire database at any time.
//
// Design pattern:
//   - POST /tax → creates the record if it doesn't exist,
//                 OR updates it if it already exists
//   - GET  /tax → always returns the single record
//   - DELETE /tax → resets values to 0 (doesn't delete the doc)
//
// This approach avoids having multiple conflicting tax configs.
// ============================================================
@Schema({ timestamps: true })
export class Tax {

  // ----------------------------------------------------------
  // TAX PRICE – percentage or flat fee added to order total
  //
  // 🔴 BUG FIX: Was typed as 'string' in the class but
  //    @Prop({ type: Number }) — TypeScript type and Mongoose
  //    type were completely out of sync!
  //    Fixed: both are now consistently 'number'
  // ----------------------------------------------------------
  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Tax price cannot be negative'],
  })
  taxPrice: number; // ✅ FIXED: was 'string'

  // ----------------------------------------------------------
  // SHIPPING PRICE – flat shipping fee added to order total
  // ----------------------------------------------------------
  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Shipping price cannot be negative'],
  })
  shippingPrice: number; // ✅ FIXED: was 'string'
}

export const TaxSchema = SchemaFactory.createForClass(Tax);