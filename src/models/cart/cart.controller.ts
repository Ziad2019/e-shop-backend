import {
  Controller, Get, Post, Body, Patch,
  Param, Delete, UseGuards, Req, Put, ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam, ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';

import { CartService } from './cart.service';
import { UpdateCartItemsDto, ApplyCouponDto } from './dto/update-cart.dto';

import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '../users/users.schema';



@ApiTags('Cart')
@ApiBearerAuth('JWT-auth')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ----------------------------------------------------------
  // ADD PRODUCT TO CART
  // POST /cart/:productId
  // If cart doesn't exist → creates a new one
  // If product already in cart → increments quantity
  // ----------------------------------------------------------
  @Post(':productId')
  @Roles(UserRole.ADMIN,UserRole.USER)

  @ApiOperation({ summary: 'Add a product to the logged-in user cart' })
  @ApiParam({ name: 'productId', description: 'MongoDB ObjectId of the product' })
  @ApiResponse({ status: 201, description: 'Product added to cart successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  create(
    @Param('productId') productId: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.cartService.create(productId, req.user.id);
  }

  // ----------------------------------------------------------
  // GET MY CART
  // GET /cart
  // Returns the full cart with populated product details
  // ----------------------------------------------------------
  @Get()
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Get the logged-in user cart' })
  @ApiResponse({ status: 200, description: 'Cart fetched successfully' })
  @ApiResponse({ status: 404, description: 'No cart found for this user' })
  getLoggedUserCart(@Req() req: Request & { user: JwtPayload }) {
    return this.cartService.getLoggedUserCart(req.user.id);
  }

  // ----------------------------------------------------------
  // APPLY COUPON
  // PATCH /cart/applyCoupon

  @Patch('applyCoupon')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Apply a discount coupon to the cart' })
  @ApiBody({ type: ApplyCouponDto })
  @ApiResponse({ status: 200, description: 'Coupon applied successfully' })
  @ApiResponse({ status: 400, description: 'Coupon is expired or invalid' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  applyCoupon(
    @Req() req: Request & { user: JwtPayload },
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    applyCouponDto: ApplyCouponDto,
  ) {
    return this.cartService.applyCoupon(req.user.id, applyCouponDto);
  }

  // ----------------------------------------------------------
  // UPDATE CART ITEM
  // PUT /cart/:cartItemId
  // Update quantity and/or color of a specific cart item
  // ----------------------------------------------------------
  @Put(':cartItemId')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Update quantity or color of a cart item' })
  @ApiParam({ name: 'cartItemId', description: 'The _id of the cart item to update' })
  @ApiBody({ type: UpdateCartItemsDto })
  @ApiResponse({ status: 200, description: 'Cart item updated successfully' })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  updateCartItem(
    @Param('cartItemId') cartItemId: string,
    @Req() req: Request & { user: JwtPayload },
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    updateCartItemsDto: UpdateCartItemsDto,
  ) {
    return this.cartService.updateCartItem(cartItemId, req.user.id, updateCartItemsDto);
  }

  // ----------------------------------------------------------
  // REMOVE CART ITEM
  // DELETE /cart/:itemId
  // Removes a specific item from the cart by its _id
  // ----------------------------------------------------------
  @Delete(':itemId')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Remove a specific item from the cart' })
  @ApiParam({ name: 'itemId', description: 'The _id of the cart item to remove' })
  @ApiResponse({ status: 200, description: 'Item removed from cart successfully' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  removeSpecificCartItem(
    @Param('itemId') itemId: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.cartService.removeSpecificCartItem(itemId, req.user.id);
  }
}