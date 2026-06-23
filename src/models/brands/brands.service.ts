import {
  HttpException, HttpStatus,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Brand } from './brands.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name)
    private readonly brandModel: Model<Brand>,
  ) {}


  async create(createBrandDto: CreateBrandDto): Promise<ApiResponse<Brand>> {
    // Check if brand name already exists (case-insensitive)
    const existingBrand = await this.brandModel.findOne({
      name: new RegExp(`^${createBrandDto.name}$`, 'i'),
    });

    if (existingBrand) {
      throw new HttpException(
        `Brand "${createBrandDto.name}" already exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const newBrand = await this.brandModel.create(createBrandDto);

    return {
      status: HttpStatus.CREATED, 
      message: 'Brand created successfully',
      data: newBrand,
    };
  }

  // ----------------------------------------------------------
  // GET ALL BRANDS
  // Returns all brands sorted alphabetically by name
  // -__v → excludes the internal Mongoose version field
  // ----------------------------------------------------------
  async findAll(): Promise<ApiResponse<Brand[]>> {
    const brands = await this.brandModel
      .find()
      .select('-__v')
      .sort({ name: 'asc' }); // alphabetical order

    return {
      status: HttpStatus.OK,
      message: 'Brands fetched successfully',
      length: brands.length,
      data: brands,
    };
  }

  // ----------------------------------------------------------
  // GET SINGLE BRAND BY ID
  // ----------------------------------------------------------
  async findOne(id: string): Promise<ApiResponse<Brand>> {
    const brand = await this.brandModel.findById(id).select('-__v');

    if (!brand) {
      throw new NotFoundException(`Brand with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Brand fetched successfully',
      data: brand,
    };
  }


  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<ApiResponse<Brand>> {
    const updatedBrand = await this.brandModel
      .findByIdAndUpdate(id, updateBrandDto, {
        new: true,           // return the updated document
        runValidators: true, // run schema validators on update
      })
      .select('-__v');

    // findByIdAndUpdate returns null if no document was found
    if (!updatedBrand) {
      throw new NotFoundException(`Brand with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Brand updated successfully',
      data: updatedBrand,
    };
  }

  // ----------------------------------------------------------
  // DELETE BRAND
  // Hard delete — permanently removes from database
  // findByIdAndDelete returns null if not found
  // ----------------------------------------------------------
  async remove(id: string): Promise<ApiResponse<null>> {
    const brand = await this.brandModel.findByIdAndDelete(id);

    if (!brand) {
      throw new NotFoundException(`Brand with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Brand deleted successfully',
      data: null,
    };
  }
}