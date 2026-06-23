import {
  Injectable, BadRequestException,
  NotFoundException, Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

import { Image, ImageDocument } from './image.schema';

import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { UploadOptions } from 'src/common/interfaces/upload-options.interface';

@Injectable()
export class UploadService {

  // ============================================================
  // DEFAULT OPTIONS
  // Used as fallback when no options are passed by the caller.
  // Individual modules can override any of these.
  // ============================================================
  private readonly defaultOptions: UploadOptions = {
    folder: 'uploads',
    maxWidth: 2000,
    maxHeight: 2000,
    quality: 90,
    generateSizes: true,
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  };

  constructor(
    @InjectModel(Image.name)
    private readonly imageModel: Model<ImageDocument>,
  ) {}

  // ----------------------------------------------------------
  // UPLOAD SINGLE IMAGE
  // Validates the file, uploads to Cloudinary, saves to DB
  // Returns the saved ImageDocument with all URLs
  // ----------------------------------------------------------
  async uploadImage(
    file: Express.Multer.File, 
    options?: UploadOptions,
  ): Promise<ImageDocument> {

    // Merge provided options with defaults
    const opts: UploadOptions = { ...this.defaultOptions, ...options };

    // 1) Validate file before uploading
    this.validateFile(file, opts);

    // 2) Upload to Cloudinary and get the result
    const uploadResult = await this.uploadToCloudinary(file, opts);

    // 3) Generate pre-computed size variant URLs
    //    Stored in DB so we don't need to generate them on each request
    const urls = this.generateImageUrls(uploadResult.public_id, opts.generateSizes);

    // 4) Save image metadata to MongoDB
    const image = new this.imageModel({
      url:          uploadResult.secure_url,
      publicId:     uploadResult.public_id,
      thumbnailUrl: urls.thumbnail,
      mediumUrl:    urls.medium,
      largeUrl:     urls.large,
      format:       uploadResult.format,
      width:        uploadResult.width,
      height:       uploadResult.height,
      bytes:        uploadResult.bytes,
    });

    return image.save();
  }

  // ----------------------------------------------------------
  // UPLOAD MULTIPLE IMAGES
  // Uploads all files in parallel using Promise.all
  // Much faster than uploading one by one sequentially
  // ----------------------------------------------------------
  async uploadImages(
    files: Express.Multer.File[], // ✅ properly typed
    options?: UploadOptions,
  ): Promise<ImageDocument[]> {

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Promise.all → runs all uploads simultaneously
    const uploadPromises = files.map((file) => this.uploadImage(file, options));
    return Promise.all(uploadPromises);
  }

  // ----------------------------------------------------------
  // DELETE IMAGE
  // Deletes from BOTH Cloudinary AND MongoDB
  async deleteImage(imageId: string): Promise<ApiResponse<null>> {
    const image = await this.imageModel.findById(imageId);

    if (!image) {
      throw new NotFoundException(`Image with id "${imageId}" not found`); // ✅ 404
    }

    // Delete from Cloudinary first (so we don't have orphaned DB records)
    await cloudinary.uploader.destroy(image.publicId);

    // Then delete from MongoDB
    await image.deleteOne();

    return {
      status: 200,
      message: 'Image deleted successfully',
      data: null,
    };
  }

  // ----------------------------------------------------------
  // DELETE MULTIPLE IMAGES
  // Deletes all provided image IDs from Cloudinary and MongoDB
  // Uses bulkDelete on Cloudinary for efficiency
  // ----------------------------------------------------------
  async deleteImages(imageIds: string[]): Promise<void> {
    if (!imageIds || imageIds.length === 0) return;

    const images = await this.imageModel.find({ _id: { $in: imageIds } });
    if (images.length === 0) return;

    // Delete all from Cloudinary in a single API call
    const publicIds = images.map((img) => img.publicId);
    await cloudinary.api.delete_resources(publicIds);

    // Delete all from MongoDB in a single query
    await this.imageModel.deleteMany({ _id: { $in: imageIds } });
  }

  // ----------------------------------------------------------
  // GET IMAGE BY ID
  //
  // 🟡 FIX: Changed BadRequestException to NotFoundException
  // ----------------------------------------------------------
  async getImage(imageId: string): Promise<ImageDocument> {
    const image = await this.imageModel.findById(imageId);

    if (!image) {
      throw new NotFoundException(`Image with id "${imageId}" not found`); // ✅ 404
    }

    return image;
  }

  // ----------------------------------------------------------
  // UPDATE IMAGE METADATA
  // Updates alt text and/or custom metadata fields
  //
  // 🟡 FIX: Changed BadRequestException to NotFoundException
  // ----------------------------------------------------------
  async updateImageMetadata(
    imageId: string,
    metadata: { alt?: string; metadata?: Record<string, any> },
  ): Promise<ImageDocument> {

    const image = await this.imageModel.findByIdAndUpdate(
      imageId,
      { $set: metadata },
      { new: true, runValidators: true },
    );

    if (!image) {
      throw new NotFoundException(`Image with id "${imageId}" not found`); // ✅ 404
    }

    return image;
  }

  // ============================================================
  // PRIVATE HELPER METHODS
  // ============================================================

  // ----------------------------------------------------------
  // VALIDATE FILE
  // Checks file size and extension before uploading
  // Throws BadRequestException with descriptive message
  // ----------------------------------------------------------
  private validateFile(file: Express.Multer.File, options: UploadOptions): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file size against configured maximum
    if (file.size > options.maxFileSize!) {
      const maxSizeMB = options.maxFileSize! / 1024 / 1024;
      throw new BadRequestException(
        `File size exceeds the maximum allowed size of ${maxSizeMB}MB`,
      );
    }

    // Check file extension against allowed formats list
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension || !options.allowedFormats!.includes(fileExtension)) {
      throw new BadRequestException(
        `File type ".${fileExtension}" is not allowed. ` +
        `Allowed types: ${options.allowedFormats!.join(', ')}`,
      );
    }
  }

  // ----------------------------------------------------------
  // UPLOAD TO CLOUDINARY
  // Uses upload_stream to pipe the file buffer directly to Cloudinary
  // without saving it to disk first (memory-efficient)
  //
  // streamifier.createReadStream() converts the Buffer (from multer)
  // into a readable stream that Cloudinary's upload_stream can consume
  // ----------------------------------------------------------
  private uploadToCloudinary(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          transformation: [
            {
              width:        options.maxWidth,
              height:       options.maxHeight,
              crop:         'limit',   // only shrink, never enlarge
              quality:      options.quality,
              fetch_format: 'auto',   // auto-select best format (webp etc.)
            },
          ],
        },
        (error, result) => {
          if (error)   return reject(error);
          if (!result) return reject(new Error('Upload failed: no result returned'));
          resolve(result);
        },
      );

      // Convert Buffer → ReadableStream → pipe to Cloudinary
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  // ----------------------------------------------------------
  // GENERATE IMAGE URLS
  // Creates Cloudinary transformation URLs for different sizes.
  // These are stored in the DB at upload time so we don't need
  // to generate them dynamically on every API response.
  //
  // crop: 'fill'  → fills exact dimensions (may crop edges)
  // crop: 'limit' → only shrinks, preserves aspect ratio
  // ----------------------------------------------------------
  private generateImageUrls(
    publicId: string,
    generateSizes: boolean = true,
  ): { thumbnail: string | null; medium: string | null; large: string | null } {

    if (!generateSizes) {
      return { thumbnail: null, medium: null, large: null };
    }

    return {
      // Small square thumbnail for lists, avatars, grids
      thumbnail: cloudinary.url(publicId, {
        width:        200,
        height:       200,
        crop:         'fill',
        quality:      'auto',
        fetch_format: 'auto',
        secure:       true,
      }),

      // Medium for product cards and category pages
      medium: cloudinary.url(publicId, {
        width:        600,
        height:       600,
        crop:         'fill',
        quality:      'auto',
        fetch_format: 'auto',
        secure:       true,
      }),

      // Large for product detail pages and full-size views
      large: cloudinary.url(publicId, {
        width:        1200,
        height:       1200,
        crop:         'limit',     // preserve aspect ratio for large images
        quality:      'auto:best',
        fetch_format: 'auto',
        secure:       true,
      }),
    };
  }
}