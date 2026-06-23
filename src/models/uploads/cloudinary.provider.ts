import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

// ============================================================
// CLOUDINARY PROVIDER
// Configures and provides the Cloudinary v2 SDK instance
// as an injectable dependency using NestJS custom providers.
//
// Usage in service:
//   @Inject('CLOUDINARY') private cloudinary: typeof cloudinary
//
// The token 'CLOUDINARY' is used to inject this configured
// instance wherever it's needed.
// ============================================================
export const CloudinaryProvider = {
  provide: 'CLOUDINARY',

  // useFactory → called once at startup with injected dependencies
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_NAME'),
      api_key:    configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  },

  // inject → list of providers to pass to useFactory
  inject: [ConfigService],
};