import {
  Controller, Post, Delete, Get, Put,
  Param, Body, UseInterceptors,
  UploadedFile, UploadedFiles,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiConsumes, ApiParam, ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { UploadService } from './uploads.service';

import { ImageDocument } from './image.schema';
import { UploadOptions } from 'src/common/interfaces/upload-options.interface';

// ============================================================
// UPLOAD CONTROLLER – base route: /upload
// Handles direct image upload/management endpoints.
//
// Note: Most modules (products, categories) call UploadService
// directly from their own service — these routes are for
// standalone image management (e.g., from an admin panel).
// ============================================================
@ApiTags('Uploads')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ----------------------------------------------------------
  // UPLOAD SINGLE IMAGE
  // POST /upload/image
  // Accepts multipart/form-data with an 'image' field
  // ----------------------------------------------------------
  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a single image to Cloudinary' })
  @ApiConsumes('multipart/form-data') // tells Swagger this accepts file
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File, // ✅ properly typed
    @Body() options?: UploadOptions,
  ) {
    const image = await this.uploadService.uploadImage(file, options);
    return {
      status: HttpStatus.CREATED,
      message: 'Image uploaded successfully',
      data: image,
    };
  }

  // ----------------------------------------------------------
  // UPLOAD MULTIPLE IMAGES
  // POST /upload/images
  // Accepts up to 10 images in 'images' field
  // ----------------------------------------------------------
  @Post('images')
  @UseInterceptors(FilesInterceptor('images', 10))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload multiple images to Cloudinary (max 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[], // ✅ properly typed
    @Body() options?: UploadOptions,
  ) {
    const images = await this.uploadService.uploadImages(files, options);
    return {
      status: HttpStatus.CREATED,
      message: 'Images uploaded successfully',
      length: images.length,
      data: images,
    };
  }

  // ----------------------------------------------------------
  // DELETE IMAGE
  // DELETE /upload/:id
  // Deletes from both Cloudinary and the database
  // ----------------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an image by ID (from Cloudinary + DB)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the image' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async deleteImage(@Param('id') id: string) {
    return this.uploadService.deleteImage(id);
  }

  // ----------------------------------------------------------
  // GET IMAGE BY ID
  // GET /upload/:id
  // ----------------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Get image metadata by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the image' })
  @ApiResponse({ status: 200, description: 'Image found successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async getImage(@Param('id') id: string) {
    const image = await this.uploadService.getImage(id);
    return {
      status: HttpStatus.OK,
      message: 'Image fetched successfully',
      data: image,
    };
  }

  // ----------------------------------------------------------
  // UPDATE IMAGE METADATA
  // PUT /upload/:id/metadata
  // Updates alt text or custom metadata for an image
  // ----------------------------------------------------------
  @Put(':id/metadata')
  @ApiOperation({ summary: 'Update alt text or metadata for an image' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the image' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        alt:      { type: 'string', example: 'iPhone 15 Pro in Black' },
        metadata: { type: 'object', example: { photographer: 'John' } },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image metadata updated successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async updateImageMetadata(
    @Param('id') id: string,
    @Body() metadata: { alt?: string; metadata?: Record<string, any> },
  ) {
    const image = await this.uploadService.updateImageMetadata(id, metadata);
    return {
      status: HttpStatus.OK,
      message: 'Image metadata updated successfully',
      data: image,
    };
  }
}