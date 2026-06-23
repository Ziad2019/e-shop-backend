import {
  HttpException, HttpStatus,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Category } from './categories.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UploadService } from '../uploads/uploads.service';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    private readonly uploadService: UploadService,
  ) {}

  // ----------------------------------------------------------
  // CREATE CATEGORY

async create(
  createCategoryDto: CreateCategoryDto,
  image?: Express.Multer.File,
): Promise<ApiResponse<Category>> {

  const exists = await this.categoryModel.findOne({
    name: new RegExp(`^${createCategoryDto.name}$`, 'i'),
  })
  if (exists) {
    throw new HttpException(
      `Category "${createCategoryDto.name}" already exists`,
      HttpStatus.BAD_REQUEST,
    )
  }

  let imageId: string | null = null
  if (image) {
    const uploaded = await this.uploadService.uploadImage(image, {
      folder: 'categories',
      maxWidth: 800,
      maxHeight: 800,
      quality: 85,
    })
    imageId = (uploaded as any)._id
  }

  const newCategory = await (
    await this.categoryModel.create({
      ...createCategoryDto,
      image: imageId,
    })
  ).populate('image')

  return {
    status: HttpStatus.CREATED,
    message: 'Category created successfully',
    data: newCategory,
  }
}

  // ----------------------------------------------------------
  // GET ALL CATEGORIES
  async findAll(): Promise<ApiResponse<Category[]>> {
    const categories = await this.categoryModel
      .find()
      .select('-__v')
      .populate('image')
      .sort({ name: 'asc' });

    return {
      status: HttpStatus.OK,
      message: 'Categories fetched successfully',
      length: categories.length,
      data: categories,
    };
  }

  // ----------------------------------------------------------
  // GET SINGLE CATEGORY BY ID
  // Using findById() instead of findOne({_id}) — cleaner and
  // Mongoose handles the ObjectId conversion automatically
  // ----------------------------------------------------------
  async findOne(id: string): Promise<ApiResponse<Category>> {
    const category = await this.categoryModel
      .findById(id)
      .select('-__v')
      .populate('image');

    if (!category) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Category fetched successfully',
      data: category,
    };
  }

  // ----------------------------------------------------------
  // UPDATE CATEGORY

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    image?: Express.Multer.File,
  ): Promise<ApiResponse<Category>> {

    // Build the update object from the DTO
  
    const updateData: Record<string, any> = { ...updateCategoryDto };

    // Only upload image if a new file was actually provided
    if (image) {
      const uploadedImage = await this.uploadService.uploadImage(image, {
        folder: 'categories',
        maxWidth: 800,
        maxHeight: 800,
        quality: 85,
      });
      updateData.image = (uploadedImage as any)._id;
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .select('-__v')
      .populate('image');

    if (!updatedCategory) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Category updated successfully',
      data: updatedCategory,
    };
  }

  // ----------------------------------------------------------
  // DELETE CATEGORY
  // Using findByIdAndDelete for a single clean query
  // instead of findOne + deleteOne (was 2 separate queries)
  // ----------------------------------------------------------
  async remove(id: string): Promise<ApiResponse<null>> {
    const category = await this.categoryModel.findByIdAndDelete(id);

    if (!category) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Category deleted successfully',
      data: null,
    };
  }
}