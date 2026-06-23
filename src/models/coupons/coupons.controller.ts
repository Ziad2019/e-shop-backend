import {
  Controller, Get, Post, Body, Patch,
  Param, Delete, UseGuards, ValidationPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam, ApiBody,
} from '@nestjs/swagger';

import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';


// ============================================================
// COUPONS CONTROLLER – base route: /coupons
// All routes are admin-only

@ApiTags('Coupons')
@ApiBearerAuth('JWT-auth')

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ----------------------------------------------------------
  // CREATE COUPON
  // POST /coupons
  // ----------------------------------------------------------
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin creates a new discount coupon' })
  @ApiBody({ type: CreateCouponDto })
  @ApiResponse({ status: 201, description: 'Coupon created successfully' })
  @ApiResponse({ status: 400, description: 'Coupon already exists or date is in the past' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  create(
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    createCouponDto: CreateCouponDto,
  ) {
    // ✅ Expiry validation moved to the service
    return this.couponsService.create(createCouponDto);
  }

  // ----------------------------------------------------------
  // GET ALL COUPONS
  // GET /coupons
  // ----------------------------------------------------------
  @Get()
  @ApiOperation({ summary: 'Admin gets all coupons' })
  @ApiResponse({ status: 200, description: 'List of all coupons' })
  findAll() {
    return this.couponsService.findAll();
  }

  // ----------------------------------------------------------
  // GET SINGLE COUPON
  // GET /coupons/:id
  // ----------------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Admin gets a single coupon by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the coupon' })
  @ApiResponse({ status: 200, description: 'Coupon found successfully' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  // ----------------------------------------------------------
  // UPDATE COUPON
  // PATCH /coupons/:id
  // ----------------------------------------------------------
  @Patch(':id')
  @ApiOperation({ summary: 'Admin updates a coupon by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the coupon' })
  @ApiBody({ type: UpdateCouponDto })
  @ApiResponse({ status: 200, description: 'Coupon updated successfully' })
  @ApiResponse({ status: 400, description: 'Expire date is in the past' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    updateCouponDto: UpdateCouponDto,
  ) {
    // ✅ Expiry validation moved to the service
    return this.couponsService.update(id, updateCouponDto);
  }

  // ----------------------------------------------------------
  // DELETE COUPON
  // DELETE /coupons/:id
  // ----------------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'Admin deletes a coupon by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the coupon' })
  @ApiResponse({ status: 200, description: 'Coupon deleted successfully' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}