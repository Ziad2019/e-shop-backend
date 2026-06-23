import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { Request } from 'express';

import { Order, OrderDocument } from './orders.schema';
import { Cart } from '../cart/cart.schema';
import { Product } from '../products/products.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { User } from '../users/users.schema';

@Injectable()
export class OrdersService {
  private readonly stripe: Stripe;

  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
    @InjectModel(Cart.name)
    private readonly cartModel: Model<Cart>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {
    // Initialize Stripe with the secret key from environment variables
    // this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
    //   apiVersion: '2025-04-30', // always pin to a specific API version
    // });

    {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');
    }
  }

  // ----------------------------------------------------------
  // CREATE CASH ORDER
  // Flow:
  //   1. Find the cart by cartId
  //   2. Calculate total price (use discounted price if coupon was applied)
  //   3. Create the order document
  //   4. Update product stock quantities using bulkWrite (single DB call)
  //   5. Delete the cart (it's now an order)
  // ----------------------------------------------------------
  async createCashOrder(
    cartId: string,
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<ApiResponse<OrderDocument>> {
    // App-level settings (can be moved to a config service later)
    const TAX_PRICE = 0;
    const SHIPPING_PRICE = 0;

    // 1) Get the cart
    const cart = await this.cartModel.findOne({ _id: cartId, user: userId });
    if (!cart) {
      throw new NotFoundException('Cart not found or does not belong to you');
    }

    if (cart.cartItems.length === 0) {
      throw new HttpException('Cart is empty', HttpStatus.BAD_REQUEST);
    }

    // 2) Use discounted price if a coupon was applied, otherwise use regular price
    const cartPrice = cart.totalPriceAfterDiscount ?? cart.totalCartPrice;
    const totalOrderPrice = cartPrice + TAX_PRICE + SHIPPING_PRICE;

    // 3) Create the order
    const order = await this.orderModel.create({
      user: userId,
      cartItems: cart.cartItems,
      shippingAddress: createOrderDto.shippingAddress,
      paymentMethodType: createOrderDto.paymentMethodType ?? 'cash',
      taxPrice: TAX_PRICE,
      shippingPrice: SHIPPING_PRICE,
      totalOrderPrice,
    });

    if (!order) {
      throw new NotFoundException('Failed to create order');
    }

    // 4) Decrement product quantity and increment sold count
    //    bulkWrite sends ALL updates in a SINGLE DB call (efficient!)
    const bulkOptions = cart.cartItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product, quantity: { $gte: item.quantity } },
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    }));

    const result = await this.productModel.bulkWrite(bulkOptions);

    // 5) Delete the cart — it's now been converted to an order
    await this.cartModel.findByIdAndDelete(cartId);

    return {
      status: HttpStatus.CREATED,
      message: 'Order created successfully',
      data: order,
    };
  }

  // ----------------------------------------------------------
  // GET ALL ORDERS (Admin)

  async findAllOrders(): Promise<ApiResponse<OrderDocument[]>> {
    const orders = await this.orderModel
      .find()
      .populate('user', 'name email') // show user name + email
      .populate('cartItems.product', 'title') // show product title
      .sort({ createdAt: -1 }); // newest first

    return {
      status: HttpStatus.OK,
      message: 'Orders fetched successfully',
      length: orders.length,
      data: orders,
    };
  }

  // ----------------------------------------------------------
  // GET SPECIFIC ORDER BY ID
  //
  async findSpecificOrder(
    orderId: string,
    currentUser: JwtPayload,
  ): Promise<ApiResponse<OrderDocument>> {
    const order = await this.orderModel
      .findById(orderId)
      .populate('user', 'name email')
      .populate('cartItems.product', 'title price');

    if (!order) {
      throw new NotFoundException(`Order with id "${orderId}" not found`);
    }

    // Non-admin users can only view their own orders
    if (
      currentUser.role !== 'admin' &&
      order.user.toString() !== currentUser.id
    ) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return {
      status: HttpStatus.OK,
      message: 'Order fetched successfully',
      data: order,
    };
  }

  // ----------------------------------------------------------
  // UPDATE ORDER TO PAID
  //

  async updateOrderToPaid(id: string): Promise<ApiResponse<OrderDocument>> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with id "${id}" not found`);
    }

    order.isPaid = true;
    order.paidAt = new Date();

    const updatedOrder = await order.save();

    return {
      status: HttpStatus.OK,
      message: 'Order marked as paid',
      data: updatedOrder,
    };
  }

  // ----------------------------------------------------------
  // UPDATE ORDER TO DELIVERED
  //

  async updateOrderToDelivered(
    id: string,
  ): Promise<ApiResponse<OrderDocument>> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with id "${id}" not found`);
    }

    order.isDelivered = true;
    order.deliveredAt = new Date();

    const updatedOrder = await order.save();

    return {
      status: HttpStatus.OK,
      message: 'Order marked as delivered',
      data: updatedOrder,
    };
  }

  // ----------------------------------------------------------
  // STRIPE CHECKOUT SESSION
  //
  // Creates a Stripe hosted checkout page for card payments.
  // The user is redirected to Stripe's UI to complete payment.
  //
  // After payment:
  //   - success_url → redirect to orders page
  //   - cancel_url  → redirect back to cart
  //
  // The actual order creation after Stripe payment should be
  // handled via a Stripe webhook (see commented code below)
  // ----------------------------------------------------------
  async checkoutSession(cartId: string, req: Request & { user: JwtPayload }) {
    const TAX_PRICE = 0;
    const SHIPPING_PRICE = 0;

    const cart = await this.cartModel.findById(cartId);
    if (!cart) {
      throw new NotFoundException(`Cart with id "${cartId}" not found`);
    }

    const cartPrice = cart.totalPriceAfterDiscount ?? cart.totalCartPrice;
    const totalOrderPrice = cartPrice + TAX_PRICE + SHIPPING_PRICE;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'egp',
            // Stripe expects amounts in the smallest currency unit (piastres)
            unit_amount: Math.round(totalOrderPrice * 100),
            product_data: {
              name: 'Order Payment',
              description: `Cart #${cartId}`,
            },
          },
          quantity: 1,
        },
      ],
      // Where to redirect after payment
      success_url: `${req.protocol}://${req.get('host')}/orders`,
      cancel_url: `${req.protocol}://${req.get('host')}/cart`,
      customer_email: req.user.email,
      client_reference_id: cartId, // used in webhook to find the cart
    });

    return {
      status: HttpStatus.OK,
      message: 'Checkout session created',
      session,
    };
  }

  // ----------------------------------------------------------
  // WEBHOOK HANDLER (for card orders after Stripe payment)
  // This should be called from a separate webhook controller
  // when Stripe sends a 'checkout.session.completed' event.
  // Uncomment and move to a WebhookController when ready.
  // ----------------------------------------------------------
  async handleStripeWebhook(session: Stripe.Checkout.Session) {
    const cartId = session.client_reference_id;
    const orderPrice = (session.amount_total ?? 0) / 100;

    const cart = await this.cartModel.findById(cartId);
    const user = await this.userModel.findOne({
      email: session.customer_email,
    });

    const order = await this.orderModel.create({
      user: user._id,
      cartItems: cart.cartItems,
      totalOrderPrice: orderPrice,
      isPaid: true,
      paidAt: new Date(),
      paymentMethodType: 'card',
    });

    if (order) {
      const bulkOptions = cart.cartItems.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
        },
      }));
      await this.productModel.bulkWrite(bulkOptions);
      await this.cartModel.findByIdAndDelete(cartId);
    }
  }

  // ----------------------------------------------------------
  // GET LOGGED-IN USER'S ORDERS
  // GET /orders/my-orders
  // Returns only the orders belonging to the current user
  // ----------------------------------------------------------
  async findMyOrders(userId: string): Promise<ApiResponse<OrderDocument[]>> {
    const orders = await this.orderModel
      .find({ user: userId })
      .populate({
        path: 'cartItems.product',
        select: 'title imageCover',
        populate: { path: 'imageCover', select: 'url' },
      })
      .sort({ createdAt: -1 });

    return {
      status: HttpStatus.OK,
      message: 'Orders fetched successfully',
      length: orders.length,
      data: orders,
    };
  }
}
