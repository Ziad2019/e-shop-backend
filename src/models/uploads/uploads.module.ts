import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { UploadService } from './uploads.service';
import { UploadController } from './uploads.controller';
import { CloudinaryProvider } from './cloudinary.provider';
import { Image, ImageSchema } from './image.schema';

// ============================================================
// UPLOADS MODULE
//
// @Global() → makes UploadService available to ALL modules
//             without needing to import UploadsModule everywhere.
//             Since almost every module (products, categories etc.)
//             needs to upload images, making it global saves
//             repeated imports.
//
// exports: [UploadService] → other modules can inject UploadService
// ============================================================
@Global()
@Module({
  imports: [
    ConfigModule, // needed by CloudinaryProvider to read .env
    MongooseModule.forFeature([
      { name: Image.name, schema: ImageSchema },
    ]),
  ],
  controllers: [UploadController],
  providers: [
    CloudinaryProvider, // provides configured Cloudinary instance
    UploadService,
  ],
  exports: [UploadService], // make available globally
})
export class UploadsModule {}