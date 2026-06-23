import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { Coupon, CouponSchema } from './coupons.schema';
import { UsersModule } from '../users/users.module';

// ============================================================
// COUPONS MODULE
// Handles everything related to discount coupons.
// Admin-only module — only admins can create/read/update/delete coupons.
// Users interact with coupons only through the Cart module.
//
// imports:
//   - MongooseModule → registers Coupon model for injection
//   - UsersModule    → provides UserModel used by AuthGuard
// ============================================================
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Coupon.name, schema: CouponSchema },
    ]),
    UsersModule, // needed for AuthGuard to inject UserModel
  ],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [MongooseModule], // allows CartModule to use CouponModel
})
export class CouponsModule {}