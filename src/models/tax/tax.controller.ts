import {
  Controller, Get, Post, Body,
  Delete, UseGuards, ValidationPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiBody,
} from '@nestjs/swagger';

import { TaxService } from './tax.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '../users/users.schema';

// ============================================================
// TAX CONTROLLER – base route: /tax
// All routes are admin-only.
//
// This module uses a SINGLETON pattern:
//   Only one tax config document exists in the database.
//   POST creates it if missing, or updates if it already exists.
// ============================================================
@ApiTags('Tax')
@ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN)
      // all routes are admin-only
@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  // ----------------------------------------------------------
  // CREATE OR UPDATE TAX CONFIG
  // POST /tax
  // If no tax record exists → creates one
  // If tax record exists    → updates it
  //
  // 🟡 FIX: Added ValidationPipe — was missing before,
  //    meaning DTO validation was NOT running!
  // ----------------------------------------------------------
  @Post()
  @HttpCode(HttpStatus.OK) // always 200 since it could be create OR update
  @ApiOperation({ summary: 'Admin creates or updates the tax configuration' })
  @ApiBody({ type: CreateTaxDto })
  @ApiResponse({ status: 200, description: 'Tax configuration saved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  create(
    @Body(new ValidationPipe({ forbidNonWhitelisted: true })) // ✅ ADDED
    createTaxDto: CreateTaxDto,
  ) {
    return this.taxService.createOrUpdate(createTaxDto);
  }

  // ----------------------------------------------------------
  // GET TAX CONFIG
  // GET /tax
  // Returns the current tax and shipping prices
  // ----------------------------------------------------------
  @Get()
  @ApiOperation({ summary: 'Admin gets the current tax configuration' })
  @ApiResponse({ status: 200, description: 'Tax configuration fetched successfully' })
  @ApiResponse({ status: 404, description: 'No tax configuration found yet' })
  find() {
    return this.taxService.find();
  }

  // ----------------------------------------------------------
  // RESET TAX CONFIG
  // DELETE /tax
  // Resets both taxPrice and shippingPrice back to 0
  // Does NOT delete the document (keeps the singleton alive)
  // ----------------------------------------------------------
  @Delete()
  @ApiOperation({ summary: 'Admin resets tax and shipping prices to 0' })
  @ApiResponse({ status: 200, description: 'Tax configuration reset successfully' })
  reset() {
    return this.taxService.reset();
  }
}