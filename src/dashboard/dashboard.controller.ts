import {
  Controller, Get, Query,
  UseGuards, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';



import { DashboardService } from './dashboard.service';
import { DateRangeDto } from './dto/date-range.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';


// ============================================================
// DASHBOARD CONTROLLER – base route: /dashboard
// All routes are admin-only.
// ============================================================
@ApiTags('Dashboard')
@ApiBearerAuth()
// @UseGuards(AuthGuard)
// @Roles('admin')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ----------------------------------------------------------
  // OVERVIEW
  // GET /dashboard/overview
  // Returns all key metrics in one request
  // Used for the main dashboard page
  // ----------------------------------------------------------
  @Get('overview')
  @ApiOperation({ summary: 'Get full dashboard overview stats' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Overview stats returned' })
  getOverview() {
    return this.dashboardService.getOverview();
  }

  // ----------------------------------------------------------
  // SALES STATISTICS
  // GET /dashboard/sales?period=monthly&year=2026
  // Returns revenue grouped by period (daily/monthly/yearly)
  // ----------------------------------------------------------
  @Get('sales')
  @ApiOperation({ summary: 'Get sales statistics grouped by period' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['daily', 'monthly', 'yearly'],
    description: 'Grouping period (default: monthly)',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Filter by year (default: current year)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Sales stats returned' })
  getSales(@Query() dateRange: DateRangeDto) {
    return this.dashboardService.getSalesStats(dateRange);
  }

  // ----------------------------------------------------------
  // ORDERS STATISTICS
  // GET /dashboard/orders
  // Returns orders grouped by status
  // ----------------------------------------------------------
  @Get('orders')
  @ApiOperation({ summary: 'Get orders statistics by status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Orders stats returned' })
  getOrders() {
    return this.dashboardService.getOrdersStats();
  }

  // ----------------------------------------------------------
  // USERS STATISTICS
  // GET /dashboard/users
  // Returns users growth over time
  // ----------------------------------------------------------
  @Get('users')
  @ApiOperation({ summary: 'Get users growth statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users stats returned' })
  getUsers() {
    return this.dashboardService.getUsersStats();
  }

  // ----------------------------------------------------------
  // PRODUCTS STATISTICS
  // GET /dashboard/products
  // Returns products overview
  // ----------------------------------------------------------
  @Get('products')
  @ApiOperation({ summary: 'Get products statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Products stats returned' })
  getProducts() {
    return this.dashboardService.getProductsStats();
  }

  // ----------------------------------------------------------
  // TOP SELLING PRODUCTS
  // GET /dashboard/top-products?limit=10
  // ----------------------------------------------------------
  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of products to return (default: 10)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Top products returned' })
  getTopProducts(@Query('limit') limit: number = 10) {
    return this.dashboardService.getTopProducts(Number(limit));
  }

  // ----------------------------------------------------------
  // TOP CATEGORIES
  // GET /dashboard/top-categories?limit=5
  // ----------------------------------------------------------
  @Get('top-categories')
  @ApiOperation({ summary: 'Get top categories by revenue' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of categories to return (default: 5)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Top categories returned' })
  getTopCategories(@Query('limit') limit: number = 5) {
    return this.dashboardService.getTopCategories(Number(limit));
  }

  // ----------------------------------------------------------
  // RECENT ORDERS
  // GET /dashboard/recent-orders?limit=10
  // ----------------------------------------------------------
  @Get('recent-orders')
  @ApiOperation({ summary: 'Get most recent orders' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of orders to return (default: 10)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Recent orders returned' })
  getRecentOrders(@Query('limit') limit: number = 10) {
    return this.dashboardService.getRecentOrders(Number(limit));
  }

  // ----------------------------------------------------------
  // RECENT USERS
  // GET /dashboard/recent-users?limit=10
  // ----------------------------------------------------------
  @Get('recent-users')
  @ApiOperation({ summary: 'Get most recently registered users' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of users to return (default: 10)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Recent users returned' })
  getRecentUsers(@Query('limit') limit: number = 10) {
    return this.dashboardService.getRecentUsers(Number(limit));
  }
}