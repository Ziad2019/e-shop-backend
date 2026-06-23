import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ReviewService } from './review.service';
import { ReviewController, ReviewDashboardController } from './review.controller';
import { Review, ReviewSchema } from './review.schema';
import { Product, ProductSchema,  } from '../products/products.schema';
import { UsersModule } from '../users/users.module';

// ============================================================
// REVIEW MODULE
// Handles product reviews: create, read, update, delete.
//
// Two controllers:
//   ReviewController          → public/user routes (/review)
//   ReviewDashboardController → admin routes (/dashboard/review)
//
// Models needed:
//   - Review  → main CRUD operations
//   - Product → update ratingsAverage + ratingsQuantity after each review
//
// 🟡 FIX: Removed duplicate User model registration.
//    UsersModule already exports MongooseModule with UserModel,
//    so we don't need to re-register it here.
// ============================================================
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name,  schema: ReviewSchema  },
      { name: Product.name, schema: ProductSchema },
      // ✅ User model comes from UsersModule — no need to re-register
    ]),
    UsersModule,
  ],
  controllers: [
    ReviewController,
    ReviewDashboardController, // ✅ FIXED: typo in name
  ],
  providers: [ReviewService],
})
export class ReviewModule {}