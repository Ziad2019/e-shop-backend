import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  ValidationPipe, UseGuards, UseInterceptors, UploadedFile,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiBody, ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '../users/users.schema';
import { Public } from 'src/auth/decorators/public.decorator';


// ============================================================
// CATEGORIES CONTROLLER – base route: /categories
//
// Public routes  → findAll, findOne (no login needed)
// Private routes → create, update, remove (admin only)
//
// File Upload: create and update accept multipart/form-data
// with an optional 'image' file field
// ============================================================
@ApiTags('Categories')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ----------------------------------------------------------
  // CREATE CATEGORY
  // POST /categories
  // Accepts optional image file upload (multipart/form-data)
  // @ApiConsumes → tells Swagger this route accepts file uploads
  // ----------------------------------------------------------
@Post()
  @Roles(UserRole.ADMIN)

@UseInterceptors(FileInterceptor('image'))
@HttpCode(HttpStatus.CREATED)
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    required: ['name'],
    properties: {
      name:  { type: 'string' },
      image: { type: 'string', format: 'binary' }, 
    },
  },
})
create(
  @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  createCategoryDto: CreateCategoryDto,
  @UploadedFile() image?: Express.Multer.File,
) {
  return this.categoriesService.create(createCategoryDto, image)
}

  // ----------------------------------------------------------
  // GET ALL CATEGORIES
  // GET /categories
  // Public – no authentication required
  // ----------------------------------------------------------
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'List of all categories' })
  findAll() {
    return this.categoriesService.findAll();
  }

  // ----------------------------------------------------------
  // GET SINGLE CATEGORY
  // GET /categories/:id
  // Public – no authentication required
  // ----------------------------------------------------------
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single category by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the category' })
  @ApiResponse({ status: 200, description: 'Category found successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  // ----------------------------------------------------------
  // UPDATE CATEGORY
  // PATCH /categories/:id
  // Admin only – supports optional image upload
  // ----------------------------------------------------------
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  // @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Admin updates a category (supports image upload)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the category' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() image?: Express.Multer.File, // ✅ properly typed
  ) {
    return this.categoriesService.update(id, updateCategoryDto, image);
  }

  // ----------------------------------------------------------
  // DELETE CATEGORY
  // DELETE /categories/:id
  // Admin only
  // ----------------------------------------------------------
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  // @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Admin deletes a category' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}