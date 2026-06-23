import { Injectable, HttpStatus } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Wishlist } from './wishlist.schema'
import { ApiResponse } from 'src/common/interfaces/api-response.interface'

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel: Model<Wishlist>,
  ) {}

 
  private async getOrCreate(userId: string) {
    let wishlist = await this.wishlistModel
      .findOne({ user: userId })
       .populate({
      path: 'products',
      populate: {
        path: 'imageCover',
        select: '-__v',
      },
    })
     

    if (!wishlist) {
      wishlist = await this.wishlistModel.create({ user: userId, products: [] })
    }
    return wishlist
  }

  // ── GET /wishlist ──
  async findMine(userId: string): Promise<ApiResponse<Wishlist>> {
    const wishlist = await this.getOrCreate(userId)
    return {
      status:  HttpStatus.OK,
      message: 'Wishlist fetched successfully',
      data:    wishlist,
    }
  }

  // ── POST /wishlist/:productId ──
  async addProduct(userId: string, productId: string): Promise<ApiResponse<Wishlist>> {
    const wishlist = await this.wishlistModel.findOneAndUpdate(
      { user: userId },
      { $addToSet: { products: productId } },
      { new: true, upsert: true },
    ).populate('products')

    return {
      status:  HttpStatus.OK,
      message: 'Product added to wishlist',
      data:    wishlist,
    }
  }

  // ── DELETE /wishlist/:productId ──
  async removeProduct(userId: string, productId: string): Promise<ApiResponse<Wishlist>> {
    const wishlist = await this.wishlistModel.findOneAndUpdate(
      { user: userId },
      { $pull: { products: productId } },
      { new: true },
    ).populate('products')

    return {
      status:  HttpStatus.OK,
      message: 'Product removed from wishlist',
      data:    wishlist,
    }
  }
}