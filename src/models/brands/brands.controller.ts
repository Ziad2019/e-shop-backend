import {
  Controller, Get, Post, Body,
  Patch, Param, Delete,
  UseGuards, ValidationPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam, ApiBody,
} from '@nestjs/swagger';

import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

import { UserRole } from '../users/users.schema';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

// ============================================================
// BRANDS CONTROLLER – base route: /brands
//
// Public routes  → findAll, findOne (no login needed)
// Private routes → create, update, remove (admin only)
//
// @ApiTags      → groups all routes under "Brands" in Swagger UI
// @ApiBearerAuth → tells Swagger that some routes need a token
// ============================================================
@ApiTags('Brands')
@ApiBearerAuth('JWT-auth')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  // ----------------------------------------------------------
  // CREATE BRAND
  // POST /brands
  // Admin only – creates a new brand
  // ----------------------------------------------------------
  @Post()
   @Roles(UserRole.ADMIN)

  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin creates a new brand' })
  @ApiBody({ type: CreateBrandDto })
  @ApiResponse({ status: 201, description: 'Brand created successfully' })
  @ApiResponse({ status: 400, description: 'Brand already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  create(
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    createBrandDto: CreateBrandDto,
  ) {
    return this.brandsService.create(createBrandDto);
  }

  // ----------------------------------------------------------
  // GET ALL BRANDS
  // GET /brands
  // Public – no authentication required
  // ----------------------------------------------------------
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all brands' })
  @ApiResponse({ status: 200, description: 'List of all brands' })
  findAll() {
    return this.brandsService.findAll();
  }

  // ----------------------------------------------------------
  // GET SINGLE BRAND
  // GET /brands/:id
  // Public – no authentication required
  // ----------------------------------------------------------
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single brand by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the brand' })
  @ApiResponse({ status: 200, description: 'Brand found successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  // ----------------------------------------------------------
  // UPDATE BRAND
  // PATCH /brands/:id
  // Admin only
  // ----------------------------------------------------------
  @Patch(':id')
    @Roles(UserRole.ADMIN)

  @ApiOperation({ summary: 'Admin updates a brand by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the brand' })
  @ApiBody({ type: UpdateBrandDto })
  @ApiResponse({ status: 200, description: 'Brand updated successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    updateBrandDto: UpdateBrandDto,
  ) {
    return this.brandsService.update(id, updateBrandDto);
  }

  // ----------------------------------------------------------
  // DELETE BRAND
  // DELETE /brands/:id
  // Admin only
  // ----------------------------------------------------------
  @Delete(':id')
  @Roles(UserRole.ADMIN)

  @ApiOperation({ summary: 'Admin deletes a brand by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the brand' })
  @ApiResponse({ status: 200, description: 'Brand deleted successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}