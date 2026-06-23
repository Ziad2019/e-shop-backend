
export interface UploadOptions {
  // Cloudinary folder to store the image in (e.g., 'products/covers')
  folder?: string;

  // Maximum width in pixels — Cloudinary will resize if larger
  maxWidth?: number;

  // Maximum height in pixels — Cloudinary will resize if larger
  maxHeight?: number;

  // Compression quality: 1-100 (90 = high quality, smaller file)
  quality?: number;

  // Whether to generate thumbnail/medium/large size variants
  generateSizes?: boolean;

  // Allowed file extensions (e.g., ['jpg', 'png', 'webp'])
  allowedFormats?: string[];

  // Maximum allowed file size in bytes (default: 10MB)
  maxFileSize?: number;
}