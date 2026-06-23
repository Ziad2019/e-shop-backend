import {
  BadRequestException,
  HttpException, HttpStatus,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from './users.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { UploadService } from '../uploads/uploads.service';




// ============================================================
// GENERIC API RESPONSE INTERFACE
// Gives every response a consistent shape:
// { status, message, data, length? }
// T is a generic → ApiResponse<User> or ApiResponse<User[]>
// ============================================================


@Injectable()
export class UsersService {
  constructor(
    // @InjectModel injects the Mongoose Model so we can query MongoDB
    // The model name must match what was registered in MongooseModule.forFeature()
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly uploadService: UploadService,
  ) {}

  // ----------------------------------------------------------
  // CREATE USER (Admin)
  // Checks for duplicate email, then creates the user
  // Password hashing is handled automatically by the pre-save hook
  // ----------------------------------------------------------
  async create(createUserDto: CreateUserDto): Promise<ApiResponse<User>> {
    // Prevent duplicate accounts with the same email
    const existUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existUser) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.create(createUserDto);

    return {
      status: HttpStatus.CREATED,
      message: 'User created successfully',
      data: user,
    };
  }

  // ----------------------------------------------------------
  // GET ALL USERS (Admin)
  // Supports: filtering by name/email/role (case-insensitive)
  //           pagination via skip & _limit
  //           sorting by name
  //
  // new RegExp(value, 'i') → case-insensitive partial match
  // An empty string '' creates a RegExp that matches everything,
  // so filters are optional by default
  // ----------------------------------------------------------
  async findAll(query: UsersQueryDto): Promise<ApiResponse<User[]>> {
    const {
      _limit = 1_000_000,
      skip = 0,
      sort = 'asc',
      name = '',
      email = '',
      role = '',
    } = query;

    const users = await this.userModel
      .find()
      .skip(Number(skip))
      .limit(Number(_limit))
      .where('name',  new RegExp(name,  'i'))
      .where('email', new RegExp(email, 'i'))
      .where('role',  new RegExp(role,  'i'))
      .sort({ name: sort as 'asc' | 'desc' })
      .select('-password -__v') // exclude sensitive/internal fields
      .exec();

    return {
      status: HttpStatus.OK,
      message: 'Users fetched successfully',
      length: users.length,
      data: users,
    };
  }

  // ----------------------------------------------------------
  // GET SINGLE USER BY ID (Admin)
  // ----------------------------------------------------------
  async findOne(id: string): Promise<ApiResponse<User>> {
    const user = await this.userModel.findById(id).select('-password -__v');

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'User fetched successfully',
      data: user,
    };
  }

  // ----------------------------------------------------------
  // UPDATE USER BY ID (Admin)
  // { new: true } → returns the updated document, not the old one
  // ----------------------------------------------------------
  async update(id: string, updateUserDto: UpdateUserDto): Promise<ApiResponse<User>> {
    const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'User updated successfully',
      data: user,
    };
  }

  // ----------------------------------------------------------
  // DELETE USER BY ID (Admin)
  // Hard delete — permanently removes from database
  // ----------------------------------------------------------
  async remove(id: string): Promise<ApiResponse<User>> {
    const user = await this.userModel.findByIdAndDelete(id);

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return {
      status: HttpStatus.OK,
      message: 'User deleted successfully',
      data: user,
    };
  }

  // ============================================================
  // SELF-MANAGEMENT METHODS
  // These use the JWT payload (req.user) to identify WHO is making
  // the request, instead of reading an ID from the URL
  // ============================================================

  // ----------------------------------------------------------
  // GET MY PROFILE
  // payload is the decoded JWT token attached by AuthGuard
  // ----------------------------------------------------------
  async getMe(payload: JwtPayload): Promise<ApiResponse<User>> {
    if (!payload?.id) {
      throw new NotFoundException('User ID not found in token');
    }

    const user = await this.userModel.findById(payload.id).select('-password -__v');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      status: HttpStatus.OK,
      message: 'Profile fetched successfully',
      data: user,
    };
  }


  async updateMe(payload: JwtPayload, updateUserDto: UpdateUserDto): Promise<ApiResponse<User>> {
    if (!payload?.id) {
      throw new NotFoundException('User ID not found in token');
    }

  // findByIdAndUpdate correctly accepts an id string
    const user = await this.userModel.findByIdAndUpdate(
      payload.id,
      updateUserDto,
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      status: HttpStatus.OK,
      message: 'Profile updated successfully',
      data: user,
    };
  }


  async deleteMe(payload: JwtPayload): Promise<ApiResponse<User>> {
    if (!payload?.id) {
      throw new NotFoundException('User ID not found in token');
    }
   
    const user = await this.userModel.findByIdAndDelete(payload.id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      status: HttpStatus.OK,
      message: 'Account deleted successfully',
      data: user,
    };
  }

  async updateAvatar(user: JwtPayload, file: Express.Multer.File) {
  if (!file) {
    throw new BadRequestException('Avatar file is required');
  }

  const uploaded = await this.uploadService.uploadImage(file, {
    folder: 'avatars',
    maxWidth: 400,
    maxHeight: 400,
    quality: 85,
  });

  const updatedUser = await this.userModel
    .findByIdAndUpdate(
      user.id,
      { avatar: (uploaded as any).url ?? (uploaded as any).secure_url },
      { new: true },
    )
    .select('-password -refreshToken');

  return {
    status: HttpStatus.OK,
    message: 'Avatar updated successfully',
    data: updatedUser,
  };
}

}