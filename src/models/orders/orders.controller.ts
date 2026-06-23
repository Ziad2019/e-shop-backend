import {
  Controller, Get, Post, Body, Patch,
  Param, UseGuards, Req, HttpCode, HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam, ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '../users/users.schema';


@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}



  @Get('my-orders')
@Roles(UserRole.USER, UserRole.ADMIN)
@ApiOperation({ summary: 'Get logged-in user orders' })
@ApiResponse({ status: 200, description: 'User orders fetched successfully' })
findMyOrders(@Req() req: Request & { user: JwtPayload }) {

  return this.ordersService.findMyOrders(req.user.id);
}

  // ----------------------------------------------------------
  // CREATE CASH ORDER
  // POST /orders/:cartId
  // Creates an order from the cart, then clears the cart
  // ----------------------------------------------------------
  @Post(':cartId')
  @Roles(UserRole.ADMIN,UserRole.USER)

  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a cash order from a cart' })
  @ApiParam({ name: 'cartId', description: 'MongoDB ObjectId of the cart' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  createCashOrder(
    @Param('cartId') cartId: string,
    @Req() req: Request & { user: JwtPayload },
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.createCashOrder( 
      cartId,
      req.user.id,
      createOrderDto,
    );
  }


  //   @Post('checkout-session/:cartId')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Create a Stripe checkout session for card payment' })
  @ApiParam({ name: 'cartId', description: 'MongoDB ObjectId of the cart' })
  @ApiResponse({ status: 200, description: 'Stripe session created' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  checkoutSession(
    @Param('cartId') cartId: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.ordersService.checkoutSession(cartId, req);
  }

  // ----------------------------------------------------------
  // GET ALL ORDERS
  // GET /orders
  // Admin only
  // ----------------------------------------------------------
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin gets all orders' })
  @ApiResponse({ status: 200, description: 'List of all orders' })
  findAllOrders() {
    return this.ordersService.findAllOrders();
  }

  // ----------------------------------------------------------
  // GET SPECIFIC ORDER
  // GET /orders/:id
  
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get a specific order by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the order' })
  @ApiResponse({ status: 200, description: 'Order found successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findSpecificOrder(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.ordersService.findSpecificOrder(id, req.user);
  }

  
  // ----------------------------------------------------------
  // MARK ORDER AS PAID
  // PATCH /orders/:id/pay
  // Admin only
  // ----------------------------------------------------------
  @Patch(':id/pay')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin marks an order as paid' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the order' })
  @ApiResponse({ status: 200, description: 'Order marked as paid' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateOrderToPaid(@Param('id') id: string) {
    return this.ordersService.updateOrderToPaid(id);
  }

  // ----------------------------------------------------------
  // MARK ORDER AS DELIVERED
  // PATCH /orders/:id/deliver
  // Admin only
  // ----------------------------------------------------------
  @Patch(':id/deliver')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin marks an order as delivered' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the order' })
  @ApiResponse({ status: 200, description: 'Order marked as delivered' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateOrderToDelivered(@Param('id') id: string) {
    return this.ordersService.updateOrderToDelivered(id);
  }

}