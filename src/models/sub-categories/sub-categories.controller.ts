import {
  Controller, Get, Post, Body, Patch,
  Param, Delete, UseGuards, ValidationPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam, ApiBody,
} from '@nestjs/swagger';

import { SubCategoriesService } from './sub-categories.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '../users/users.schema';
import { Public } from 'src/auth/decorators/public.decorator';


// ============================================================
// SUB CATEGORIES CONTROLLER – base route: /subCategories
//
// Public routes  → findAll, findOne
// Private routes → create, update, remove (admin only)
// ============================================================
@ApiTags('Sub-Categories')
@ApiBearerAuth('JWT-auth')
@Controller('subCategories')
export class SubCategoriesController {
  constructor(private readonly subCategoriesService: SubCategoriesService) {}

  // ----------------------------------------------------------
  // CREATE SUB CATEGORY
  // POST /subCategories
  // ----------------------------------------------------------
  @Post()
    @Roles(UserRole.ADMIN)

  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin creates a new sub-category' })
  @ApiBody({ type: CreateSubCategoryDto })
  @ApiResponse({ status: 201, description: 'Sub-category created successfully' })
  @ApiResponse({ status: 400, description: 'Sub-category already exists' })
  @ApiResponse({ status: 404, description: 'Parent category not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  create(
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    createSubCategoryDto: CreateSubCategoryDto, // ✅ camelCase (not PascalCase)
  ) {
    return this.subCategoriesService.create(createSubCategoryDto);
  }

  // ----------------------------------------------------------
  // GET ALL SUB CATEGORIES
  // GET /subCategories
  // Public
  // ----------------------------------------------------------
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all sub-categories' })
  @ApiResponse({ status: 200, description: 'List of all sub-categories' })
  findAll() {
    return this.subCategoriesService.findAll();
  }

  // ----------------------------------------------------------
  // GET SINGLE SUB CATEGORY
  // GET /subCategories/:id
  // Public
  // ----------------------------------------------------------
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single sub-category by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the sub-category' })
  @ApiResponse({ status: 200, description: 'Sub-category found successfully' })
  @ApiResponse({ status: 404, description: 'Sub-category not found' })
  findOne(@Param('id') id: string) {
    return this.subCategoriesService.findOne(id);
  }

  // ----------------------------------------------------------
  // UPDATE SUB CATEGORY
  // PATCH /subCategories/:id
  // ----------------------------------------------------------
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin updates a sub-category by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the sub-category' })
  @ApiBody({ type: UpdateSubCategoryDto })
  @ApiResponse({ status: 200, description: 'Sub-category updated successfully' })
  @ApiResponse({ status: 404, description: 'Sub-category not found' })
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    updateSubCategoryDto: UpdateSubCategoryDto, // ✅ camelCase
  ) {
    return this.subCategoriesService.update(id, updateSubCategoryDto);
  }

  // ----------------------------------------------------------
  // DELETE SUB CATEGORY
  // DELETE /subCategories/:id
  // ----------------------------------------------------------
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin deletes a sub-category by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the sub-category' })
  @ApiResponse({ status: 200, description: 'Sub-category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Sub-category not found' })
  remove(@Param('id') id: string) {
    return this.subCategoriesService.remove(id);
  }
}