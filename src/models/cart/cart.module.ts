import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Cart, CartSchema } from './cart.schema';
import { Product, ProductSchema,  } from '../products/products.schema';
import { Coupon, CouponSchema,  } from '../coupons/coupons.schema';
import { UsersModule } from '../users/users.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name,    schema: CartSchema    },
      { name: Product.name, schema: ProductSchema },
      { name: Coupon.name,  schema: CouponSchema
        },

    ]),
    UsersModule, // provides UserModel used by AuthGuard
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}