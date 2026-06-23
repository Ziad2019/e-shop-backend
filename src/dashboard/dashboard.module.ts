import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';



import { User, UserSchema }           from '../models/users/users.schema';
import { Product, ProductSchema }     from '../models/products/products.schema';
import { Order, OrderSchema }         from '../models/orders/orders.schema';
import { Category, CategorySchema }   from '../models/categories/categories.schema';
import { Review, ReviewSchema }       from '../models/review/review.schema';
import { Coupon, CouponSchema }       from '../models/coupons/coupons.schema';
import { UsersModule }                from '../models/users/users.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

// ============================================================
// DASHBOARD MODULE
// Provides analytics and statistics for the admin dashboard.
// All routes are admin-only.
//
// Imports all models directly to run aggregation queries
// across multiple collections in a single service.
// ============================================================
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name,     schema: UserSchema     },
      { name: Product.name,  schema: ProductSchema  },
      { name: Order.name,    schema: OrderSchema    },
      { name: Category.name, schema: CategorySchema },
      { name: Review.name,   schema: ReviewSchema   },
      { name: Coupon.name,   schema: CouponSchema   },
    ]),
    UsersModule, // for AuthGuard
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}