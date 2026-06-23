import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { Brand, BrandSchema } from './brands.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
    UsersModule, // provides UserModel used by AuthGuard
  ],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [MongooseModule], // export so other modules can use BrandModel if needed
})
export class BrandsModule {}