import {
  HttpStatus, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Tax, TaxDocument } from './tax.schema';
import { CreateTaxDto } from './dto/create-tax.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

@Injectable()
export class TaxService {
  constructor(
    @InjectModel(Tax.name)
    private readonly taxModel: Model<Tax>,
  ) {}

  // ----------------------------------------------------------
  // CREATE OR UPDATE TAX CONFIG (Upsert)
  //
  // Since only ONE tax document should ever exist, this method:
  //   - If no document → creates a new one (returns 201)
  //   - If document exists → updates it (returns 200)
  //
  // 🔴 BUG FIX: create was returning status 200 — fixed to 201
  //
  // Alternative approach: MongoDB $setOnInsert + upsert: true
  // allows doing this in a SINGLE query (shown below)
  // ============================================================
  async createOrUpdate(createTaxDto: CreateTaxDto): Promise<ApiResponse<TaxDocument>> {

    // findOneAndUpdate with upsert: true:
    //   - If document exists → updates it and returns updated doc
    //   - If no document → creates a new one
    // This replaces the if/else pattern with a SINGLE DB call
    const tax = await this.taxModel.findOneAndUpdate(
      {},              // filter: match any document (singleton)
      createTaxDto,    // update: apply the new values
      {
        new: true,     // return the updated/created document
        upsert: true,  // create if doesn't exist
        runValidators: true,
      },
    ).select('-__v');

    return {
      status: HttpStatus.OK,
      message: 'Tax configuration saved successfully',
      data: tax,
    };
  }

  // ----------------------------------------------------------
  // GET TAX CONFIG
  // Returns the single tax document
  // Returns 404 if no tax has been configured yet
  // ----------------------------------------------------------
  async find(): Promise<ApiResponse<TaxDocument>> {
    const tax = await this.taxModel.findOne({}).select('-__v');

    if (!tax) {
      throw new NotFoundException(
        'No tax configuration found. Please create one first.',
      );
    }

    return {
      status: HttpStatus.OK,
      message: 'Tax configuration fetched successfully',
      data: tax,
    };
  }

  // ----------------------------------------------------------
  // RESET TAX CONFIG
  //
  // 🔴 BUG FIX: Was returning void — now returns ApiResponse
  //    so the client gets a confirmation message
  //
  // Resets values to 0 but keeps the document alive (singleton)
  // ----------------------------------------------------------
  async reset(): Promise<ApiResponse<TaxDocument>> {
    const tax = await this.taxModel.findOneAndUpdate(
      {},
      { taxPrice: 0, shippingPrice: 0 }, // reset both to 0
      { new: true },                      // return updated document
    ).select('-__v');

    if (!tax) {
      throw new NotFoundException(
        'No tax configuration found to reset.',
      );
    }

    return {
      status: HttpStatus.OK,
      message: 'Tax configuration reset to 0 successfully',
      data: tax,
    };
  }
}