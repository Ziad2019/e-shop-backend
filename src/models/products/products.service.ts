import {
  HttpException, HttpStatus,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Product, ProductDocument, ProductStatus } from './products.schema';
import { Category } from '../categories/categories.schema';
import { SubCategory } from '../sub-categories/sub-categories.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsQueryDto, SortField } from './dto/products-query.dto';
import { UploadService } from '../uploads/uploads.service';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    @InjectModel(SubCategory.name)
    private readonly subCategoryModel: Model<SubCategory>,
    private readonly uploadService: UploadService,
  ) {}


  async create(
    createProductDto: CreateProductDto,
    imageCover?: Express.Multer.File,
    images?: Express.Multer.File[],
  ): Promise<ApiResponse<ProductDocument>> {

    // 1) Check for duplicate title
    const existingProduct = await this.productModel.findOne({
      title: new RegExp(`^${createProductDto.title}$`, 'i'),
    });
    if (existingProduct) {
      throw new HttpException(
        `Product "${createProductDto.title}" already exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2) Validate category
    if (createProductDto.category) {
      const category = await this.categoryModel.findById(createProductDto.category);
      if (!category) {
        throw new HttpException(
          `Category with id "${createProductDto.category}" not found`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // 3) Validate subCategory (only if provided)
    if (createProductDto.subCategory) {
      const subCategory = await this.subCategoryModel.findById(
        createProductDto.subCategory,
      );
      if (!subCategory) {
        throw new HttpException(
          `SubCategory with id "${createProductDto.subCategory}" not found`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // 4) Validate priceAfterDiscount < price
    const priceAfterDiscount = createProductDto.priceAfterDiscount ?? 0;
    if (
      priceAfterDiscount > 0 &&
      createProductDto.price &&
      createProductDto.price < priceAfterDiscount
    ) {
      throw new HttpException(
        'Price after discount must be less than the original price',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 5) Upload cover image if provided
    let imageCoverId: string | null = null;
    if (imageCover) {
      const uploaded = await this.uploadService.uploadImage(imageCover, {
        folder: 'products/imageCover',
        maxWidth: 800,
        maxHeight: 800,
        quality: 85,
      });
      imageCoverId = (uploaded as any)._id;
    }

    // 6) Upload additional images if provided
    let imagesIds: string[] | null = null;
    if (images && images.length > 0) {
      const uploaded = await this.uploadService.uploadImages(images, {
        folder: 'products/images',
        maxWidth: 800,
        maxHeight: 800,
        quality: 85,
      });
      imagesIds = (uploaded as any[]).map((img) => img._id);
    }

    // 7) Create the product
    const newProduct = await (
      await this.productModel.create({
        ...createProductDto,       // ← spread DTO fields at top level
        imageCover: imageCoverId,
        images: imagesIds ?? [],
      })
    ).populate('category subCategory brand imageCover', '-__v');

    return {
      status: HttpStatus.CREATED,
      message: 'Product created successfully',
      data: newProduct,
    };
  }

// find all Product
 async findAll(query: ProductsQueryDto): Promise<ApiResponse<ProductDocument[]>> {

  const filter: Record<string, any> = {};

  // ── Status (default: ACTIVE only) ─────────────
  filter.status = query.status ?? ProductStatus.ACTIVE;

  // ── Category & Brand ───────────────────────────
  if (query.category)   filter.category = query.category;
  if (query.brand)      filter.brand     = query.brand;

  // ── Tag ────────────────────────────────────────
  if (query.tag) filter.tags = query.tag;

  // ── Price Range ────────────────────────────────
  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    filter.price = {};
    if (query.priceMin !== undefined) filter.price.$gte = query.priceMin;
    if (query.priceMax !== undefined) filter.price.$lte = query.priceMax;
  }

  // ── Rating Range ───────────────────────────────
  if (query.ratingMin !== undefined || query.ratingMax !== undefined) {
    filter.ratingsAverage = {};
    if (query.ratingMin !== undefined) filter.ratingsAverage.$gte = query.ratingMin;
    if (query.ratingMax !== undefined) filter.ratingsAverage.$lte = query.ratingMax;
  }

  // ── Flags ──────────────────────────────────────
  if (query.isFeatured !== undefined) filter.isFeatured = query.isFeatured;
  if (query.inStock)                  filter.quantity   = { $gt: 0 };

  // ── New Arrival (last 30 days) ─────────────────
  if (query.isNewArrival) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filter.createdAt = { $gte: thirtyDaysAgo };
  }

  // ── Keyword Search ─────────────────────────────
  if (query.keyword) {
    filter.$or = [
      { title:       { $regex: query.keyword, $options: 'i' } },
      { description: { $regex: query.keyword, $options: 'i' } },
    ];
  }

  // ── Pagination ─────────────────────────────────
  const page  = query.page  ?? 1;
  const limit = query.limit ?? 10;
  const skip  = (page - 1) * limit;

  // ── Sort ───────────────────────────────────────
  const sortField = query.sort    ?? SortField.NEWEST;
  const sortDir   = query.sortDir ?? 'desc';

  // ── Field Selection ────────────────────────────
  const fields = query.fields
    ? query.fields.split(',').join(' ')
    : '-__v';

  // ── Execute ────────────────────────────────────
  const [products, total] = await Promise.all([
    this.productModel
      .find(filter)
      .limit(limit)
      .skip(skip)
      .sort({ [sortField]: sortDir })
      .select(fields)
      .populate('category brand', 'name')
      .populate('imageCover', 'url'),
    this.productModel.countDocuments(filter),
  ]);

  return {
    status:  HttpStatus.OK,
    message: 'Products fetched successfully',
    length:  products.length,
    total,
    page,
    pages:   Math.ceil(total / limit),
    data:    products,
  };
}

  // ----------------------------------------------------------
  // GET SINGLE PRODUCT BY ID
  // ----------------------------------------------------------
  async findOne(id: string): Promise<ApiResponse<ProductDocument>> {
    const product = await this.productModel
      .findById(id)
      .select('-__v')
      .populate('category subCategory brand imageCover', '-__v');

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Product fetched successfully',
      data: product,
    };
  }

  // ----------------------------------------------------------
  // UPDATE PRODUCT
  // Validates category, subCategory, and price logic before updating
  // ----------------------------------------------------------
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ApiResponse<ProductDocument>> {

    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    // Validate category if being changed
    if (updateProductDto.category) {
      const category = await this.categoryModel.findById(updateProductDto.category);
      if (!category) {
        throw new HttpException(
          `Category with id "${updateProductDto.category}" not found`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Validate subCategory if being changed
    if (updateProductDto.subCategory) {
      const subCategory = await this.subCategoryModel.findById(
        updateProductDto.subCategory,
      );
      if (!subCategory) {
        throw new HttpException(
          `SubCategory with id "${updateProductDto.subCategory}" not found`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Validate price vs priceAfterDiscount
    // Use new value if provided, otherwise fall back to existing value
    const price              = updateProductDto.price              ?? product.price;
    const priceAfterDiscount = updateProductDto.priceAfterDiscount ?? product.priceAfterDiscount;

    if (priceAfterDiscount > 0 && price < priceAfterDiscount) {
      throw new HttpException(
        'Price after discount must be less than the original price',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, {
        new: true,           // return updated document
        runValidators: true, // run schema validators
      })
      .select('-__v')
      .populate('category subCategory brand', '-__v');

    return {
      status: HttpStatus.OK,
      message: 'Product updated successfully',
      data: updatedProduct,
    };
  }


  // DELETE PRODUCT

  async remove(id: string): Promise<ApiResponse<null>> {
    const product = await this.productModel.findByIdAndDelete(id);

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'Product deleted successfully',
      data: null,
    };
  }
}