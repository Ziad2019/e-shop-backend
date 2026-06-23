import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SubCategoriesService } from './sub-categories.service';
import { SubCategoriesController } from './sub-categories.controller';
import { SubCategory, SubCategorySchema } from './sub-categories.schema';
import { Category, CategorySchema,  } from '../categories/categories.schema';
import { UsersModule } from '../users/users.module';

// ============================================================
// SUB CATEGORIES MODULE
// Handles sub-categories that belong to parent categories.
//
// imports:
//   - MongooseModule → registers SubCategory + Category models
//   - UsersModule    → provides UserModel used by AuthGuard
//
// Category model is needed to validate that the parent
// category exists when creating/updating a sub-category
// ============================================================
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubCategory.name, schema: SubCategorySchema },
      { name: Category.name,    schema: CategorySchema   },
    ]),
    UsersModule,
  ],
  controllers: [SubCategoriesController],
  providers: [SubCategoriesService],
  exports: [MongooseModule], // allows ProductsModule to use SubCategoryModel
})
export class SubCategoriesModule {}