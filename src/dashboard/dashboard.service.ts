import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User }     from '../models/users/users.schema';
import { Product }  from '../models/products/products.schema';
import { Order }    from '../models/orders/orders.schema';
import { Category } from '../models/categories/categories.schema';
import { Review }   from '../models/review/review.schema';
import { Coupon }   from '../models/coupons/coupons.schema';
import { DateRangeDto } from './dto/date-range.dto';


@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name)     private readonly userModel:     Model<User>,
    @InjectModel(Product.name)  private readonly productModel:  Model<Product>,
    @InjectModel(Order.name)    private readonly orderModel:    Model<Order>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(Review.name)   private readonly reviewModel:   Model<Review>,
    @InjectModel(Coupon.name)   private readonly couponModel:   Model<Coupon>,
  ) {}

  // ----------------------------------------------------------
  // GET OVERVIEW
  // Runs all counting queries in parallel using Promise.all
  // Much faster than running them sequentially
  // ----------------------------------------------------------
  async getOverview() {

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalCategories,
      totalReviews,
      totalCoupons,
      revenueResult,
      pendingOrders,
      paidOrders,
      deliveredOrders,
      lowStockProducts,
      activeUsers,
    ] = await Promise.all([

      // Count totals
      this.userModel.countDocuments(),
      this.productModel.countDocuments(),
      this.orderModel.countDocuments(),
      this.categoryModel.countDocuments(),
      this.reviewModel.countDocuments(),
      this.couponModel.countDocuments(),

      // Total revenue from all paid orders
      this.orderModel.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalOrderPrice' } } },
      ]),

      // Orders by status
      this.orderModel.countDocuments({ isPaid: false, isDelivered: false }),
      this.orderModel.countDocuments({ isPaid: true,  isDelivered: false }),
      this.orderModel.countDocuments({ isPaid: true,  isDelivered: true  }),

      // Products with low stock (quantity < 10)
      this.productModel.countDocuments({ quantity: { $lt: 10 } }),

      // Active users
      this.userModel.countDocuments({ active: true }),
    ]);

    const totalRevenue = revenueResult[0]?.total ?? 0;

    return {
      status: HttpStatus.OK,
      message: 'Dashboard overview fetched successfully',
      data: {
        // ── Counts ──────────────────────────────
        totalUsers,
        activeUsers,
        totalProducts,
        lowStockProducts,   // products needing restock
        totalOrders,
        totalCategories,
        totalReviews,
        totalCoupons,

        // ── Revenue ─────────────────────────────
        totalRevenue,

        // ── Orders by Status ─────────────────────
        ordersByStatus: {
          pending:   pendingOrders,   // not paid, not delivered
          paid:      paidOrders,      // paid but not delivered
          delivered: deliveredOrders, // paid and delivered
        },
      },
    };
  }

  // ----------------------------------------------------------
  // GET SALES STATS
  // Groups orders by day/month/year and sums revenue
  // Uses MongoDB $dateToString to format dates for grouping
  // ----------------------------------------------------------
  async getSalesStats(dateRange: DateRangeDto) {
    const year   = dateRange.year   ?? new Date().getFullYear();
    const period = dateRange.period ?? 'monthly';

    // Build date format string based on period
    // daily   → "2026-05-01"
    // monthly → "2026-05"
    // yearly  → "2026"
    const dateFormat = {
      daily:   '%Y-%m-%d',
      monthly: '%Y-%m',
      yearly:  '%Y',
    }[period];

    // Filter orders within the specified year
    const startDate = new Date(`${year}-01-01`);
    const endDate   = new Date(`${year}-12-31`);

    const salesData = await this.orderModel.aggregate([
      // Step 1: Only look at paid orders within the year
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },

      // Step 2: Group by formatted date and sum revenue
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$createdAt',
            },
          },
          revenue:     { $sum: '$totalOrderPrice' },
          ordersCount: { $sum: 1 },
        },
      },

      // Step 3: Sort by date ascending
      { $sort: { _id: 1 } },

      // Step 4: Rename _id to period for cleaner response
      {
        $project: {
          _id:         0,
          period:      '$_id',
          revenue:     1,
          ordersCount: 1,
        },
      },
    ]);

    return {
      status: HttpStatus.OK,
      message: 'Sales statistics fetched successfully',
      data: {
        year,
        period,
        totalRevenue: salesData.reduce((sum, item) => sum + item.revenue, 0),
        chart: salesData,
      },
    };
  }

  // ----------------------------------------------------------
  // GET ORDERS STATS
  // Returns orders grouped by payment and delivery status
  // ----------------------------------------------------------
  async getOrdersStats() {
    const [statusGroups, paymentMethods, monthlyOrders] = await Promise.all([

      // Group by isPaid + isDelivered combinations
      this.orderModel.aggregate([
        {
          $group: {
            _id: {
              isPaid:      '$isPaid',
              isDelivered: '$isDelivered',
            },
            count:   { $sum: 1 },
            revenue: { $sum: '$totalOrderPrice' },
          },
        },
      ]),

      // Group by payment method (cash vs card)
      this.orderModel.aggregate([
        {
          $group: {
            _id:     '$paymentMethodType',
            count:   { $sum: 1 },
            revenue: { $sum: '$totalOrderPrice' },
          },
        },
      ]),

      // Orders per month for current year
      this.orderModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${new Date().getFullYear()}-01-01`),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$createdAt' },
            },
            count:   { $sum: 1 },
            revenue: { $sum: '$totalOrderPrice' },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id:     0,
            month:   '$_id',
            count:   1,
            revenue: 1,
          },
        },
      ]),
    ]);

    return {
      status: HttpStatus.OK,
      message: 'Orders statistics fetched successfully',
      data: {
        statusGroups,
        paymentMethods,
        monthlyOrders,
      },
    };
  }

  // ----------------------------------------------------------
  // GET USERS STATS
  // Returns user growth and role distribution
  // ----------------------------------------------------------
  async getUsersStats() {
    const [roleDistribution, monthlyGrowth, topSpenders] = await Promise.all([

      // Users by role (admin vs user)
      this.userModel.aggregate([
        {
          $group: {
            _id:   '$role',
            count: { $sum: 1 },
          },
        },
      ]),

      // New users per month for current year
      this.userModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${new Date().getFullYear()}-01-01`),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$createdAt' },
            },
            newUsers: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id:      0,
            month:    '$_id',
            newUsers: 1,
          },
        },
      ]),

      // Top 5 users who spent the most
      this.orderModel.aggregate([
        { $match: { isPaid: true } },
        {
          $group: {
            _id:        '$user',
            totalSpent: { $sum: '$totalOrderPrice' },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from:         'users',
            localField:   '_id',
            foreignField: '_id',
            as:           'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id:        0,
            name:       '$user.name',
            email:      '$user.email',
            totalSpent: 1,
            orderCount: 1,
          },
        },
      ]),
    ]);

    return {
      status: HttpStatus.OK,
      message: 'Users statistics fetched successfully',
      data: {
        roleDistribution,
        monthlyGrowth,
        topSpenders,
      },
    };
  }

  // ----------------------------------------------------------
  // GET PRODUCTS STATS
  // ----------------------------------------------------------
  async getProductsStats() {
    const [categoryDistribution, ratingDistribution, stockStatus] =
      await Promise.all([

        // Products count per category
        this.productModel.aggregate([
          {
            $group: {
              _id:          '$category',
              productCount: { $sum: 1 },
              totalSold:    { $sum: '$sold' },
            },
          },
          {
            $lookup: {
              from:         'categories',
              localField:   '_id',
              foreignField: '_id',
              as:           'category',
            },
          },
          { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id:          0,
              categoryName: { $ifNull: ['$category.name', 'Uncategorized'] },
              productCount: 1,
              totalSold:    1,
            },
          },
          { $sort: { totalSold: -1 } },
        ]),

        // Products grouped by rating range
        this.productModel.aggregate([
          {
            $bucket: {
              groupBy:    '$ratingsAverage',
              boundaries: [0, 1, 2, 3, 4, 5],
              default:    'No Rating',
              output: {
                count: { $sum: 1 },
              },
            },
          },
        ]),

        // Stock status
        this.productModel.aggregate([
          {
            $group: {
              _id: null,
              outOfStock:  { $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] } },
              lowStock:    { $sum: { $cond: [{ $lte: ['$quantity', 10] }, 1, 0] } },
              inStock:     { $sum: { $cond: [{ $gt: ['$quantity', 10] }, 1, 0] } },
              totalValue:  { $sum: { $multiply: ['$price', '$quantity'] } },
            },
          },
        ]),
      ]);

    return {
      status: HttpStatus.OK,
      message: 'Products statistics fetched successfully',
      data: {
        categoryDistribution,
        ratingDistribution,
        stockStatus: stockStatus[0] ?? {
          outOfStock: 0,
          lowStock:   0,
          inStock:    0,
          totalValue: 0,
        },
      },
    };
  }

  // ----------------------------------------------------------
  // GET TOP PRODUCTS
  // Returns products sorted by sold count
  // ----------------------------------------------------------
  async getTopProducts(limit: number = 10) {
    const products = await this.productModel
      .find()
      .sort({ sold: -1 })          // most sold first
      .limit(limit)
      .select('title price sold ratingsAverage ratingsQuantity imageCover')
      .populate('imageCover', 'url thumbnailUrl')
      .populate('category', 'name');

    return {
      status: HttpStatus.OK,
      message: 'Top products fetched successfully',
      length: products.length,
      data: products,
    };
  }

  // ----------------------------------------------------------
  // GET TOP CATEGORIES
  // Returns categories sorted by total revenue
  // ----------------------------------------------------------
  async getTopCategories(limit: number = 5) {
    const categories = await this.orderModel.aggregate([
      // Step 1: Unwind cartItems to work with individual products
      { $unwind: '$cartItems' },

      // Step 2: Lookup product to get its category
      {
        $lookup: {
          from:         'products',
          localField:   'cartItems.product',
          foreignField: '_id',
          as:           'product',
        },
      },
      { $unwind: '$product' },

      // Step 3: Group by category and sum revenue
      {
        $group: {
          _id:         '$product.category',
          totalRevenue: { $sum: { $multiply: ['$cartItems.price', '$cartItems.quantity'] } },
          totalSold:    { $sum: '$cartItems.quantity' },
          orderCount:   { $sum: 1 },
        },
      },

      // Step 4: Sort by revenue
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },

      // Step 5: Lookup category name
      {
        $lookup: {
          from:         'categories',
          localField:   '_id',
          foreignField: '_id',
          as:           'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },

      // Step 6: Clean up the output
      {
        $project: {
          _id:          0,
          categoryName: { $ifNull: ['$category.name', 'Uncategorized'] },
          totalRevenue: 1,
          totalSold:    1,
          orderCount:   1,
        },
      },
    ]);

    return {
      status: HttpStatus.OK,
      message: 'Top categories fetched successfully',
      data: categories,
    };
  }

  // ----------------------------------------------------------
  // GET RECENT ORDERS
  // Returns latest orders with user and product info
  // ----------------------------------------------------------
  async getRecentOrders(limit: number = 10) {
    const orders = await this.orderModel
      .find()
      .sort({ createdAt: -1 })     // newest first
      .limit(limit)
      .populate('user', 'name email avatar')
      .select(
        'user totalOrderPrice isPaid isDelivered paymentMethodType createdAt cartItems',
      );

    return {
      status: HttpStatus.OK,
      message: 'Recent orders fetched successfully',
      length: orders.length,
      data: orders,
    };
  }

  // ----------------------------------------------------------
  // GET RECENT USERS
  // Returns latest registered users
  // ----------------------------------------------------------
  async getRecentUsers(limit: number = 10) {
    const users = await this.userModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name email role avatar active createdAt');

    return {
      status: HttpStatus.OK,
      message: 'Recent users fetched successfully',
      length: users.length,
      data: users,
    };
  }
}