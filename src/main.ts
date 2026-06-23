// ============================================================
// DNS CONFIGURATION
// Must be set BEFORE any other imports to ensure
// DNS resolution uses Google (8.8.8.8) and Cloudflare (1.1.1.1)
// This fixes email sending issues in some hosting environments
// where the default DNS server is slow or unreliable
// ============================================================
import * as dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';





// ============================================================
// MONGO SANITIZE FUNCTION
// Plain function — no @Injectable(), no NestJS class needed.
// Removes keys starting with $ or containing . from objects
// to prevent MongoDB NoSQL injection attacks.
//
// Applied directly as Express middleware via app.use()
// ============================================================
function sanitizeMongoQuery(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeMongoQuery);
  }

  const sanitized: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    // Block keys starting with $ (MongoDB operators) or containing .
    if (/^\$|\./.test(key)) {
      console.warn(`[MongoSanitize] Blocked key: "${key}"`);
      continue;
    }
    sanitized[key] = sanitizeMongoQuery(obj[key]);
  }
  return sanitized;
}


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get ConfigService to read env variables
  const configService = app.get(ConfigService);
  const port     = configService.get<number>('PORT') ?? 3000;
  const nodeEnv  = configService.get<string>('NODE_ENV') ?? 'development';
  const isDev    = nodeEnv === 'development';

  // ----------------------------------------------------------
  // GLOBAL PREFIX
  // All routes will be prefixed with /api/v1
  // Example: /api/v1/products, /api/v1/auth/login
  // ----------------------------------------------------------
  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  // ----------------------------------------------------------
  // GLOBAL VALIDATION PIPE
 
  // whitelist: true         → strips unknown fields from body
  // forbidNonWhitelisted    → throws error for unknown fields
  // transform: true         → auto-transforms types (string→number etc.)
  // transformOptions        → enables @Type() decorator transforms
  // ----------------------------------------------------------
app.useGlobalPipes(new ValidationPipe({
  whitelist:            true,
  forbidNonWhitelisted: true,
  transform:            true,
}))

  // ----------------------------------------------------------
  // SECURITY MIDDLEWARE
  // ----------------------------------------------------------

  // Helmet: sets security-related HTTP headers
  // contentSecurityPolicy: false → allows Swagger UI to load properly
  app.use(
    helmet({
      contentSecurityPolicy: isDev ? false : undefined,
      // In production, use default CSP
      // In development, disable it so Swagger UI works
    }),
  );

  // ----------------------------------------------------------
  // MONGO SANITIZE – NoSQL Injection Protection
  // Applied as plain Express middleware — no NestJS class needed
  // Only sanitizes body and params (NOT query — it's read-only)
  // ----------------------------------------------------------
  app.use((req: any, res: any, next: any) => {
    if (req.body)   req.body   = sanitizeMongoQuery(req.body);
    if (req.params) req.params = sanitizeMongoQuery(req.params);
    next();
  });

  // ----------------------------------------------------------
  // CORS CONFIGURATION
  //
  //    1. NestFactory.create(AppModule, { cors: true })
  //    2. app.enableCors()
  //
  // Fixed: configure once here with explicit options
  // ----------------------------------------------------------
  app.enableCors({
    origin: isDev
      ? '*'  // allow all origins in development
      : configService.get<string>('ALLOWED_ORIGINS')?.split(',') ?? [],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ----------------------------------------------------------
  // SWAGGER API DOCUMENTATION
  
  // ----------------------------------------------------------
  if (isDev) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('E-Shop API')
      .setDescription(
        'Full e-commerce REST API with authentication, products, orders, and more.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          // Configures the "Authorize" button in Swagger UI
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token (without "Bearer " prefix)',
        },
        'JWT-auth', // this name is referenced in @ApiBearerAuth() decorators
      )
      .addTag('Auth',            'Authentication endpoints')
      .addTag('Users',           'User management (admin only)')
      .addTag('User – Me',       'Logged-in user self-management')
      .addTag('Categories',      'Product categories')
      .addTag('Sub-Categories',  'Product sub-categories')
      .addTag('Brands',          'Product brands')
      .addTag('Products',        'Product catalog')
      .addTag('Reviews',         'Product reviews & ratings')
      .addTag('Cart',            'Shopping cart')
      .addTag('Coupons',         'Discount coupons (admin only)')
      .addTag('Orders',          'Order management')
      .addTag('Tax',             'Tax & shipping configuration')
      .addTag('Uploads',         'Image upload management')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // keeps JWT token between page refreshes
        tagsSorter: 'alpha',        // sort tags alphabetically
        operationsSorter: 'alpha',  // sort operations alphabetically
      },
    });

    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  }
// ----------------------------------------------------------
// COOKIE PARSER


  // ----------------------------------------------------------
  // START SERVER
  // ----------------------------------------------------------
  await app.listen(port);

  //  Only log non-sensitive info — never log DB URI or secrets!
  console.log(`🚀 Server running in ${nodeEnv} mode on port ${port}`);
  console.log(`🌐 API base URL: http://localhost:${port}/api/v1`);
}

bootstrap();