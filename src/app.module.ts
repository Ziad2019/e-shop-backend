import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { UsersModule }         from './models/users/users.module';
import { AuthModule }          from './auth/auth.module';
import { CategoriesModule }    from './models/categories/categories.module';
import { SubCategoriesModule } from './models/sub-categories/sub-categories.module';
import { BrandsModule }        from './models/brands/brands.module';
import { CouponsModule }       from './models/coupons/coupons.module';
import { ProductsModule }      from './models/products/products.module';
import { TaxModule }           from './models/tax/tax.module';
import { ReviewModule }        from './models/review/review.module';
import { CartModule }          from './models/cart/cart.module';
import { OrdersModule }        from './models/orders/orders.module';
import { UploadsModule }       from './models/uploads/uploads.module';
import { MailModule }          from './models/send-email/send-email.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WishlistModule } from './models/wishlist/wishlist.module';

// ============================================================
// APP MODULE – Root module of the application
//
// Responsibilities:
//   1. Configure global modules (Config, DB, JWT, Throttler)
//   2. Import all feature modules
//   3. Register global guards/interceptors/pipes
//
// Note: JwtModule is registered ONLY here with global: true
//   → AuthModule and AuthGuard can inject JwtService everywhere
//   → No need to register JwtModule in AuthModule again
// ============================================================
@Module({
  imports: [
    // ----------------------------------------------------------
    // CONFIG MODULE
    // Loads .env file and makes ConfigService available globally.
    // isGlobal: true → no need to import ConfigModule in every module
    // ----------------------------------------------------------
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
   
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),


    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            // Time window in milliseconds
            ttl: configService.get<number>('THROTTLE_TTL') ?? 60000,
            // Max requests per IP per time window
            limit: configService.get<number>('THROTTLE_LIMIT') ?? 10,
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // ----------------------------------------------------------
    // FEATURE MODULES
    // Each module handles a specific business domain
    // ----------------------------------------------------------
    UploadsModule,      
    MailModule,          

    UsersModule,         
    AuthModule,          

    CategoriesModule,   
    SubCategoriesModule, 
    BrandsModule,        
    ProductsModule,      

    CouponsModule,       
    CartModule,         
    OrdersModule,        

    TaxModule,          
    ReviewModule,       
    DashboardModule,
    WishlistModule,
  ],

  controllers: [],

  providers: [
    // ----------------------------------------------------------
    // GLOBAL RATE LIMIT GUARD
    // Applies ThrottlerGuard to ALL routes automatically.
    // Individual routes can opt-out with @SkipThrottle()
    // ----------------------------------------------------------
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {

}