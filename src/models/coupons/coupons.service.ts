import {
  HttpException, HttpStatus,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Coupon } from './coupons.schema';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<Coupon>,
  ) {}

  // ----------------------------------------------------------
  // PRIVATE HELPER: Validate that expireDate is in the future
  //
  // 🟡 IMPROVEMENT: Moved from controller to service
  //    Business logic (date validation) belongs in the service layer
  //    Controllers should only handle HTTP request/response
  //
  // Called in both create() and update() to avoid repeating code
  // ----------------------------------------------------------
  private validateExpireDate(expireDate: string | undefined): void {
    // Skip validation if no date provided (for partial updates)
    if (!expireDate) return;

    const isExpired = new Date(expireDate) <= new Date();
    if (isExpired) {
      throw new HttpException(
        'Expire date must be a future date',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ----------------------------------------------------------
  // CREATE COUPON
  //
  // 🔴 FIX: status was 200, should be 201 for resource creation
  // 🟡 FIX: expiry validation moved here from controller
  // ----------------------------------------------------------
  async create(createCouponDto: CreateCouponDto): Promise<ApiResponse<Coupon>> {

    // 1) Validate the expire date is in the future
    this.validateExpireDate(createCouponDto.expireDate);

    // 2) Check for duplicate coupon name (case-insensitive)
    const existingCoupon = await this.couponModel.findOne({
      name: new RegExp(`^${createCouponDto.name}$`, 'i'),
    });
    if (existingCoupon) {
      throw new HttpException(
        `Coupon "${createCouponDto.name}" already exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3) Create the new coupon
    const newCoupon = await this.couponModel.create(createCouponDto);

    return {
      status: HttpStatus.CREATED, // ✅ FIX: 201 not 200
      message: 'Coupon created successfully',
      data: newCoupon,
    };
  }

  // ----------------------------------------------------------
  // GET ALL COUPONS
  // Sorted by expireDate so soonest-expiring coupons appear first
  // ----------------------------------------------------------
  async findAll(): Promise<ApiResponse<Coupon[]>> {
    const coupons = await this.couponModel
      .find()
      .select('-__v')
      .sort({ expireDate: 'asc' }); // soonest expiry first

    return {
      status: HttpStatus.OK,
      message: 'Coupons fetched successfully',
      length: coupons.length,
      data: coupons,
    };
  }

  // ----------------------------------------------------------
  // GET SINGLE COUPON BY ID
  // ----------------------------------------------------------
  async findOne(id: string): Promise<ApiResponse<Coupon>> {
    const coupon = await this.couponModel.findById(id).select('-__v');

    if (!coupon) {
      throw new NotFoundException(`Coupon with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Coupon fetched successfully',
      data: coupon,
    };
  }

  // ----------------------------------------------------------
  // UPDATE COUPON
  //
  // 🟡 FIX: Combined findById + findByIdAndUpdate into one query
  //    using findByIdAndUpdate with null check — saves one DB call
  //
  // 🟡 FIX: expiry validation moved here from controller
  //    and only runs IF expireDate was actually provided
  // ----------------------------------------------------------
  async update(
    id: string,
    updateCouponDto: UpdateCouponDto,
  ): Promise<ApiResponse<Coupon>> {

    // Validate expiry date only if it's being updated
    this.validateExpireDate(updateCouponDto.expireDate);

    // findByIdAndUpdate returns null if not found
    const updatedCoupon = await this.couponModel
      .findByIdAndUpdate(id, updateCouponDto, {
        new: true,           // return the updated document
        runValidators: true, // run schema validators on update
      })
      .select('-__v');

    if (!updatedCoupon) {
      throw new NotFoundException(`Coupon with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Coupon updated successfully',
      data: updatedCoupon,
    };
  }

  // ----------------------------------------------------------
  // DELETE COUPON
  //
  // 🔴 FIX: was returning void with no response
  //    Changed to return a proper ApiResponse so the client
  //    knows the deletion was successful
  // ----------------------------------------------------------
  async remove(id: string): Promise<ApiResponse<null>> {
    const coupon = await this.couponModel.findByIdAndDelete(id);

    if (!coupon) {
      throw new NotFoundException(`Coupon with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Coupon deleted successfully',
      data: null,
    };
  }
}