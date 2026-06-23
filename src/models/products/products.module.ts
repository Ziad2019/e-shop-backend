import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './products.schema';
import { Category, CategorySchema,  } from '../categories/categories.schema';
import { SubCategory, SubCategorySchema } from '../sub-categories/sub-categories.schema';
import { UsersModule } from '../users/users.module';

// ============================================================
// PRODUCTS MODULE
// Core module of the e-commerce app.
// Handles full CRUD for products with file upload support.
//
// Models needed:
//   - Product     → main product CRUD
//   - Category    → validate category exists on create/update
//   - SubCategory → validate subCategory exists on create/update
//
// UsersModule → provides UserModel for AuthGuard
// UploadService must be provided globally or in this module
// ============================================================
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name,     schema: ProductSchema     },
      { name: Category.name,    schema: CategorySchema   },
      { name: SubCategory.name, schema: SubCategorySchema },
    ]),
    UsersModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [MongooseModule], // CartService and OrderService need Product model
})
export class ProductsModule {}