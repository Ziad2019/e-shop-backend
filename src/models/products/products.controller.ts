import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
  Query,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsQueryDto, SortField } from './dto/products-query.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '../users/users.schema';
import { Public } from 'src/auth/decorators/public.decorator';
import { ProductStatus } from './products.schema';

// ============================================================
// PRODUCTS CONTROLLER – base route: /products
//
// Public routes  → findAll, findOne
// Private routes → create, update, remove (admin only)
//
// File uploads: create supports imageCover (1) + images (up to 10)
// using FileFieldsInterceptor for multiple named fields
// ============================================================
@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ----------------------------------------------------------
  // CREATE PRODUCT
  // POST /products
  // Accepts multipart/form-data with imageCover + images files
  // ----------------------------------------------------------
  @Post()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'imageCover', maxCount: 1 }, // exactly 1 cover image
      { name: 'images', maxCount: 10 }, // up to 10 additional images
    ]),
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Admin creates a new product (supports file upload)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Validation error or product exists',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  create(
    @Body(new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }))
    createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      imageCover?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    const imageCover = files?.imageCover?.[0]; // single cover image
    const images = files?.images; // array of images

    return this.productsService.create(createProductDto, imageCover, images);
  }

  // ----------------------------------------------------------
  // GET ALL PRODUCTS
  // GET /products
  // Supports filtering, sorting, pagination, field selection
  // ----------------------------------------------------------
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all products (filterable, paginated)' })
  // ── Pagination ─────────────────────────────────
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page (max: 100)',
  })
  @ApiQuery({
    name: 'fields',
    required: false,
    example: 'title,price',
    description: 'Comma-separated fields to return',
  })
  // ── Search & Sort ──────────────────────────────
  @ApiQuery({
    name: 'keyword',
    required: false,
    example: 'iphone',
    description: 'Search in title & description',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: SortField,
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortDir',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort direction',
  })
  // ── Filters ────────────────────────────────────
  @ApiQuery({
    name: 'category',
    required: false,
    example: '64f1a2b3...',
    description: 'Filter by category ObjectId',
  })
  @ApiQuery({
    name: 'brand',
    required: false,
    example: '64f1a2b3...',
    description: 'Filter by brand ObjectId',
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    enum: ['new-arrival', 'sale', 'trending', 'best-seller', 'limited'],
    description: 'Filter by tag',
  })
  // ── Price & Rating ─────────────────────────────
  @ApiQuery({
    name: 'priceMin',
    required: false,
    example: 100,
    description: 'Min price',
  })
  @ApiQuery({
    name: 'priceMax',
    required: false,
    example: 5000,
    description: 'Max price',
  })
  @ApiQuery({
    name: 'ratingMin',
    required: false,
    example: 3,
    description: 'Min rating (0-5)',
  })
  @ApiQuery({
    name: 'ratingMax',
    required: false,
    example: 5,
    description: 'Max rating (0-5)',
  })
  // ── Status & Flags ─────────────────────────────
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ProductStatus,
    description: 'Product status',
  })
  @ApiQuery({
    name: 'isFeatured',
    required: false,
    example: true,
    description: 'Featured products only',
  })
  @ApiQuery({
    name: 'inStock',
    required: false,
    example: true,
    description: 'In-stock products only (quantity > 0)',
  })
  @ApiQuery({
    name: 'isNewArrival',
    required: false,
    example: true,
    description: 'Created in last 30 days',
  })
  @ApiResponse({ status: 200, description: 'Products fetched successfully' })
  findAll(@Query() query: ProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  // ----------------------------------------------------------
  // GET SINGLE PRODUCT
  // GET /products/:id
  // ----------------------------------------------------------
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single product by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the product' })
  @ApiResponse({ status: 200, description: 'Product found successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // ----------------------------------------------------------
  // UPDATE PRODUCT
  // PATCH /products/:id
  // ----------------------------------------------------------
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin updates a product by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the product' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }))
    updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // ----------------------------------------------------------
  // DELETE PRODUCT
  // DELETE /products/:id
  // ----------------------------------------------------------
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin deletes a product by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
