import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category, CategorySchema } from './categories.schema';
import { UsersModule } from '../users/users.module';

// ============================================================
// CATEGORIES MODULE
// Handles everything related to product categories.
//
// imports:
//   - MongooseModule  → registers Category model for injection
//   - UsersModule     → provides UserModel used by AuthGuard
//                       to verify the user exists on each request
// ============================================================
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
    ]),
    UsersModule, // needed for AuthGuard to inject UserModel
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [MongooseModule], // allow other modules to use CategoryModel
})
export class CategoriesModule {}