import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order, OrderSchema } from './orders.schema';
import { Product, ProductSchema,  } from '../products/products.schema';
import { Cart, CartSchema } from '../cart/cart.schema';
import { UsersModule } from '../users/users.module';

// ============================================================
// ORDERS MODULE
// Handles the full order lifecycle:
//   - Creating cash orders from cart
//   - Stripe checkout session for card payments
//   - Updating payment and delivery status (admin)
//
// Models needed:
//   - Order   → read/write orders
//   - Cart    → read cart to create order, then delete it
//   - Product → update stock quantity and sold count after order
//
// 🔴 BUG FIX: UsersModule was missing!
//    AuthGuard needs UserModel to verify the user exists.
//    Without UsersModule, AuthGuard throws a DI error.
// ============================================================
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name,   schema: OrderSchema   },
      { name: Product.name, schema: ProductSchema  },
      { name: Cart.name,    schema: CartSchema     },
      // ✅ User model comes from UsersModule (already exported there)
    ]),
    UsersModule, // ✅ ADDED: provides UserModel for AuthGuard
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [MongooseModule],
})
export class OrdersModule {}