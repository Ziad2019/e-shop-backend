import {
  HttpException, HttpStatus,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { SubCategory, SubCategoryDocument } from './sub-categories.schema';
import { Category } from '../categories/categories.schema';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

@Injectable()
export class SubCategoriesService {
  constructor(
    @InjectModel(SubCategory.name)
    private readonly subCategoryModel: Model<SubCategory>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) {}

  // ----------------------------------------------------------
  // CREATE SUB CATEGORY
  //
  // 🔴 BUG FIX: Was using CreateSubCategoryDto.name (PascalCase)
  //    which is the CLASS itself, not the parameter instance!
  //    Result: findOne({ name: undefined }) → never finds duplicates
  //    Fixed: use createSubCategoryDto.name (camelCase parameter)
  //
  // 🔴 FIX: status was 200, should be 201
  // ----------------------------------------------------------
  async create(
    createSubCategoryDto: CreateSubCategoryDto,
  ): Promise<ApiResponse<SubCategoryDocument>> {

    // 1) Check for duplicate name (case-insensitive)
    const existingSubCategory = await this.subCategoryModel.findOne({
      name: new RegExp(`^${createSubCategoryDto.name}$`, 'i'),
      //   ↑ FIXED: was CreateSubCategoryDto.name (class, not instance!)
    });
    if (existingSubCategory) {
      throw new HttpException(
        `Sub-category "${createSubCategoryDto.name}" already exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2) Validate parent category exists
    const category = await this.categoryModel.findById(
      createSubCategoryDto.category,
    );
    if (!category) {
      throw new NotFoundException(
        `Category with id "${createSubCategoryDto.category}" not found`,
      );
    }

    // 3) Create the sub-category
    const newSubCategory = await (
      await this.subCategoryModel.create(createSubCategoryDto)
    ).populate('category', '-__v');

    return {
      status: HttpStatus.CREATED, // ✅ FIX: 201 not 200
      message: 'Sub-category created successfully',
      data: newSubCategory,
    };
  }

  // ----------------------------------------------------------
  // GET ALL SUB CATEGORIES
  // Sorted alphabetically by name
  //
  // 🔴 FIX: isEmpty was returning string 'true'/'false'
  //    Removed — length field is enough for the client
  // ----------------------------------------------------------
  async findAll(): Promise<ApiResponse<SubCategoryDocument[]>> {
    const subCategories = await this.subCategoryModel
      .find()
      .select('-__v')
      .populate('category', 'name -_id')
      .sort({ name: 'asc' });

    return {
      status: HttpStatus.OK,
      message: 'Sub-categories fetched successfully',
      length: subCategories.length,
      data: subCategories,
    };
  }

  // ----------------------------------------------------------
  // GET SINGLE SUB CATEGORY BY ID
  // Using findById instead of findOne({_id}) — cleaner syntax
  // ----------------------------------------------------------
  async findOne(id: string): Promise<ApiResponse<SubCategoryDocument>> {
    const subCategory = await this.subCategoryModel
      .findById(id) // ✅ cleaner than findOne({ _id: id })
      .select('-__v')
      .populate('category', 'name -_id');

    if (!subCategory) {
      throw new NotFoundException(`Sub-category with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Sub-category fetched successfully',
      data: subCategory,
    };
  }

  // ----------------------------------------------------------
  // UPDATE SUB CATEGORY
  //
  // 🟡 IMPROVEMENT: Combined findOne + findByIdAndUpdate into
  //    a single query — saves one DB round trip.
  //    findByIdAndUpdate returns null if not found.
  // ----------------------------------------------------------
  async update(
    id: string,
    updateSubCategoryDto: UpdateSubCategoryDto,
  ): Promise<ApiResponse<SubCategoryDocument>> {

    // If category is being changed, validate the new parent exists
    if (updateSubCategoryDto.category) {
      const category = await this.categoryModel.findById(
        updateSubCategoryDto.category,
      );
      if (!category) {
        throw new NotFoundException(
          `Category with id "${updateSubCategoryDto.category}" not found`,
        );
      }
    }

    // Single query: update and return the new document
    const updatedSubCategory = await this.subCategoryModel
      .findByIdAndUpdate(id, updateSubCategoryDto, {
        new: true,           // return updated document not the old one
        runValidators: true, // run schema validators on update
      })
      .select('-__v')
      .populate('category', 'name -_id');

    // findByIdAndUpdate returns null if no document found
    if (!updatedSubCategory) {
      throw new NotFoundException(`Sub-category with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Sub-category updated successfully',
      data: updatedSubCategory,
    };
  }

  // ----------------------------------------------------------
  // DELETE SUB CATEGORY
  //
  // 🟡 IMPROVEMENT: Using findByIdAndDelete instead of
  //    findOne + deleteOne (was 2 queries, now 1 query)
  // ----------------------------------------------------------
  async remove(id: string): Promise<ApiResponse<null>> {
    const subCategory = await this.subCategoryModel.findByIdAndDelete(id);

    // findByIdAndDelete returns null if no document was found
    if (!subCategory) {
      throw new NotFoundException(`Sub-category with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Sub-category deleted successfully',
      data: null,
    };
  }
}