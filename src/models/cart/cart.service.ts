import {
  HttpException, HttpStatus,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Cart, CartDocument, CartItem } from './cart.schema';
import { Product } from '../products/products.schema';
import { Coupon } from '../coupons/coupons.schema';
import { UpdateCartItemsDto, ApplyCouponDto } from './dto/update-cart.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

// ============================================================
// CART RESPONSE INTERFACE
// Shape of the response returned by most cart operations
// ============================================================
export interface CartResponse {
  status: string;
  message?: string;
  numOfCartItems: number;
  data: CartDocument;
}

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<Cart>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<Coupon>,
  ) {}

  // ============================================================
  // PRIVATE HELPER: Calculate total cart price
  // Reduces all cart items into a single total price value
  // Formula: sum of (price × quantity) for each item
  // ============================================================
  private calculateTotalPrice(cartItems: CartItem[]): number {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0, // initial value
    );
  }

  // ----------------------------------------------------------
  // ADD PRODUCT TO CART
  // Logic:
  //   - If user has no cart → create a new one with this product
  //   - If product already in cart → increment quantity by 1
  //   - If product not in cart → push new item to cartItems
  // ----------------------------------------------------------
  async create(productId: string, userId: string): Promise<CartResponse> {
    // Find the product to get its price
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with id "${productId}" not found`);
    }

    // Try to find an existing cart for this user
    let cart = await this.cartModel.findOne({ user: userId });

    if (!cart) {
      // No cart exists → create a brand new cart with this product
      cart = await this.cartModel.create({
        user: userId,
        cartItems: [{
          product: productId,
          price: product.price,
          color: product?.color?.[0] ?? '',
        }],
      });
    } else {
      // Cart exists → check if this product is already in it
      const productIndex = cart.cartItems.findIndex(
        (item) => item.product.toString() === productId.toString(),
      );

      if (productIndex > -1) {
        // Product already in cart → just increase quantity
        cart.cartItems[productIndex].quantity += 1;
      } else {
        // Product not in cart → add as new item
        cart.cartItems.push({
          product: productId,
          price: product.price,
          color: product?.color?.[0] ?? '',
          quantity: 1,
        } as unknown as CartItem)
      }
    }

    // Recalculate and save total price using the helper
    cart.totalCartPrice = this.calculateTotalPrice(cart.cartItems);
    await cart.save();

    return {
      status: 'success',
      message: 'Product added to cart successfully',
      numOfCartItems: cart.cartItems.length,
      data: cart,
    };
  }

  // ----------------------------------------------------------
  // GET LOGGED USER CART
  // Populates product details (title and price) in each cart item
  //

  async getLoggedUserCart(userId: string): Promise<CartResponse> {
    const cart = await this.cartModel
      .findOne({ user: userId })
    .populate({
      path: 'cartItems.product',
      select: 'title price imageCover',
      populate: {
        path: 'imageCover',
        select: 'url',
      },
    });      
    if (!cart) {
      throw new NotFoundException(
        `No cart found for user "${userId}"`, 
      );
    }

    return {
      status: 'success',
      numOfCartItems: cart.cartItems.length,
      data: cart,
    };
  }

  // ----------------------------------------------------------
  // UPDATE CART ITEM (quantity and/or color)
  // Finds the item by its _id inside cartItems array
  // Only updates the fields that were provided
  // ----------------------------------------------------------
  async updateCartItem(
    cartItemId: string,
    userId: string,
    updateCartItemsDto: UpdateCartItemsDto,
  ): Promise<CartResponse> {

    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundException(`No cart found for user "${userId}"`);
    }

    // Find the item inside the cartItems array by its _id
    const itemIndex = cart.cartItems.findIndex(
      (item) => item._id.toString() === cartItemId, 
    );

    if (itemIndex === -1) {
      throw new NotFoundException(
        `Cart item with id "${cartItemId}" not found`,
      );
    }

    const cartItem = cart.cartItems[itemIndex];

    // Only update fields that were actually provided in the request
    if (updateCartItemsDto.quantity !== undefined) {
      cartItem.quantity = updateCartItemsDto.quantity;
    }
    if (updateCartItemsDto.color !== undefined) {
      cartItem.color = updateCartItemsDto.color;
    }

    cart.cartItems[itemIndex] = cartItem;

    // Recalculate total price after the update
    cart.totalCartPrice = this.calculateTotalPrice(cart.cartItems);
    await cart.save();

    return {
      status: 'success',
      numOfCartItems: cart.cartItems.length,
      data: cart,
    };
  }

  // ----------------------------------------------------------
  // REMOVE SPECIFIC CART ITEM
  //

  async removeSpecificCartItem(
    itemId: string,
    userId: string,
  ): Promise<CartResponse> {

    // $pull removes the matching element from the cartItems array
    const cart = await this.cartModel.findOneAndUpdate(
      { user: userId },
      { $pull: { cartItems: { _id: itemId } } }, 
      { new: true }, // return the updated document
    );

    if (!cart) {
      throw new NotFoundException(`No cart found for user "${userId}"`);
    }

    // Recalculate total after removal
    cart.totalCartPrice = this.calculateTotalPrice(cart.cartItems);
    await cart.save();

    return {
      status: 'success',
      numOfCartItems: cart.cartItems.length,
      data: cart,
    };
  }

  // ----------------------------------------------------------
  // APPLY COUPON
  // 
  async applyCoupon(
    userId: string,
    applyCouponDto: ApplyCouponDto,
  ): Promise<CartResponse> {

    // 1) Find the coupon by name — check existence FIRST
    const coupon = await this.couponModel.findOne({ name: applyCouponDto.name });
    if (!coupon) {
      throw new NotFoundException(`Coupon "${applyCouponDto.name}" not found`);
    }

    // 2) Check if the coupon is expired
    //    expireDate < now → coupon IS expired → throw error
    const isExpired = new Date(coupon.expireDate) < new Date();
    if (isExpired) {
      throw new HttpException(
        `Coupon "${applyCouponDto.name}" has expired`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3) Get the user's cart
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundException(`No cart found for user "${userId}"`);
    }

    // 4) Calculate discounted price
    //    Formula: totalPrice - (totalPrice * discountPercent / 100)
    const totalPrice = cart.totalCartPrice;
    const discountAmount = (totalPrice * coupon.discount) / 100;

    cart.totalPriceAfterDiscount = Number(
      (totalPrice - discountAmount).toFixed(2),
    );

    await cart.save();

    return {
      status: 'success',
      numOfCartItems: cart.cartItems.length,
      data: cart,
    };
  }
}