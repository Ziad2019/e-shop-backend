import {
  Controller, Get, Post, Body, Patch,
  Param, Delete, UseGuards, Req,
  ValidationPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam, ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';

import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '../users/users.schema';
import { Public } from 'src/auth/decorators/public.decorator';


// ============================================================
// REVIEW CONTROLLER – base route: /review
//
// Public: GET /review/:id       → get all reviews for a product
// User:   POST /review           → create a review
//         PATCH /review/:id      → update own review
//         DELETE /review/:id     → delete own review
//
// Ownership is checked in the SERVICE layer (not controller)
// because the controller should only handle routing concerns.
// ============================================================
@ApiTags('Reviews')
@ApiBearerAuth('JWT-auth')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // ----------------------------------------------------------
  // CREATE REVIEW
  // POST /review

  @Post()
   @Roles(UserRole.ADMIN)

  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Logged-in user creates a review on a product' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'User already reviewed this product' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body(new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }))
    createReviewDto: CreateReviewDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.reviewService.create(createReviewDto, req.user.id); // ✅ FIXED: .id not ._id
  }

  // ----------------------------------------------------------
  // GET ALL REVIEWS FOR A PRODUCT
  // GET /review/:id
  // Public – no auth needed
  // :id here is the productId
  // ----------------------------------------------------------
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get all reviews for a specific product' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the product' })
  @ApiResponse({ status: 200, description: 'Reviews fetched successfully' })
  findAll(@Param('id') productId: string) {
    return this.reviewService.findAll(productId);
  }

  // ----------------------------------------------------------
  // UPDATE REVIEW
  // PATCH /review/:id
  // Only the owner of the review can update it (checked in service)
  // ----------------------------------------------------------
  @Patch(':id')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'User updates their own review' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the review' })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden – not your review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }))
    updateReviewDto: UpdateReviewDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.reviewService.update(id, updateReviewDto, req.user.id); // ✅ FIXED: .id
  }

  // ----------------------------------------------------------
  // DELETE REVIEW
  // DELETE /review/:id
  // Only the owner of the review can delete it (checked in service)
  // ----------------------------------------------------------
  @Delete(':id')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'User deletes their own review' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden – not your review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.reviewService.remove(id, req.user.id); // ✅ FIXED: .id
  }
}

// ============================================================
// REVIEW DASHBOARD CONTROLLER – base route: /dashboard/review
// Admin-only routes for managing reviews

@ApiTags('Reviews - Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard/review') // ✅ FIXED: typo
export class ReviewDashboardController {
  constructor(private readonly reviewService: ReviewService) {}

  // ----------------------------------------------------------
  // GET ALL REVIEWS BY USER
  // GET /dashboard/review/:id
  // Admin gets all reviews written by a specific user
  // :id here is the userId
  // ----------------------------------------------------------
  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin gets all reviews by a specific user' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user' })
  @ApiResponse({ status: 200, description: 'User reviews fetched successfully' })
  findOne(@Param('id') userId: string) {
    return this.reviewService.findOne(userId);
  }
}