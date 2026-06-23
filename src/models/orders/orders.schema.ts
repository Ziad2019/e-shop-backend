import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

import { User } from '../users/users.schema';
import { Product } from '../products/products.schema';

// ============================================================
// SHIPPING ADDRESS INTERFACE
// Defines the structure of the embedded shipping address object.
// Using an interface gives us full TypeScript support when
// accessing order.shippingAddress.city etc.
// ============================================================
export interface ShippingAddress {
  details: string;  // street address or apartment details
  phone: string;    // contact phone for delivery
  city: string;     // city name
  postalCode: string; // ZIP / postal code
}

// ============================================================
// ORDER ITEM INTERFACE
// Defines the shape of each item inside the cartItems array.
// Same structure as CartItem but stored permanently in the order
// (even after the cart is deleted)
// ============================================================
export interface OrderItem {
  _id: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId; // reference to Product
  color: string;
  quantity: number;
  price: number; // price at time of order (locked in)
}

// ============================================================
// ORDER DOCUMENT TYPE
// ============================================================
export type OrderDocument = HydratedDocument<Order>;

// ============================================================
// PAYMENT METHOD ENUM
// Using an enum ensures only valid payment types can be stored
// ============================================================
export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
}

// ============================================================
// ORDER SCHEMA
// Represents a placed order. Created from a Cart document.
// After order creation, the cart is deleted.
//
// Order lifecycle:
//   created → isPaid: false, isDelivered: false
//   payment → isPaid: true,  paidAt: Date
//   delivery → isDelivered: true, deliveredAt: Date
// ============================================================
@Schema({ timestamps: true })
export class Order {

  // ----------------------------------------------------------
  // USER – who placed the order
  // ----------------------------------------------------------
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: [true, 'Order must belong to a user'],
  })
  user: mongoose.Types.ObjectId;

  // ----------------------------------------------------------
  // CART ITEMS – snapshot of the cart at the time of ordering
  //

  @Prop({
    type: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: Product.name,
          required: true,
        },
        color:    { type: String,  default: '' },
        quantity: { type: Number,  required: true, min: 1 },
        price:    { type: Number,  required: true, min: 0 },
      },
    ],
    required: true,
  })
  cartItems: OrderItem[];

  // ----------------------------------------------------------
  // SHIPPING ADDRESS – where to deliver the order
  //
  // 🔴 BUG FIX: Was using @Prop({ details: String, ... }) which
  //    is wrong syntax — Mongoose doesn't read it as a nested object.
  //    Fixed with proper type: { details: String, ... } structure.
  // ----------------------------------------------------------
  @Prop({
    type: {
      details:    { type: String },
      phone:      { type: String },
      city:       { type: String },
      postalCode: { type: String },
    },
    default: {},
  })
  shippingAddress: ShippingAddress;

  // ----------------------------------------------------------
  // PRICING FIELDS
  // taxPrice + shippingPrice are added on top of the cart total
  // ----------------------------------------------------------
  @Prop({ type: Number, default: 0 })
  taxPrice: number;

  @Prop({ type: Number, default: 0 })
  shippingPrice: number;

  @Prop({ type: Number, required: true })
  totalOrderPrice: number;

  // ----------------------------------------------------------
  // PAYMENT METHOD – 'cash' or 'card'
  // ----------------------------------------------------------
  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.CASH,
  })
  paymentMethodType: PaymentMethod;

  // ----------------------------------------------------------
  // PAYMENT STATUS
  // isPaid: false by default → set to true after payment
  // paidAt: the timestamp when payment was confirmed
  // ----------------------------------------------------------
  @Prop({ type: Boolean, default: false })
  isPaid: boolean;

  @Prop({ type: Date })
  paidAt: Date;

  // ----------------------------------------------------------
  // DELIVERY STATUS
  // isDelivered: false by default → set to true after delivery
  // deliveredAt: the timestamp when order was delivered
  // ----------------------------------------------------------
  @Prop({ type: Boolean, default: false })
  isDelivered: boolean;

  @Prop({ type: Date })
  deliveredAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);