import {
  Get, Post, Body, Patch, Param,
  Delete, UseGuards, Query, Controller,
  Req, ValidationPipe, HttpCode, HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam, ApiQuery, ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { Request } from 'express';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';


import { UsersQueryDto } from './dto/users-query.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from './users.schema';
import { FileInterceptor } from '@nestjs/platform-express';


// ============================================================
// USERS CONTROLLER  →  base route: /users
// All routes here are admin-only
// Handles full CRUD operations on any user in the system
//
// @ApiTags     → groups these routes under "Users" in Swagger UI
// @ApiBearerAuth → tells Swagger all routes need a Bearer token
// ============================================================
@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ----------------------------------------------------------
  // CREATE USER
  // POST /users
  // Admin manually creates a user (different from self-register)
  // ----------------------------------------------------------
  @Post()
  @Roles(UserRole.ADMIN)

  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin creates a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'User already exists or bad data' })
  @ApiResponse({ status: 401, description: 'Unauthorized – token missing/invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden – admin access only' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // ----------------------------------------------------------
  // GET ALL USERS
  // GET /users
  // Supports filtering by name, email, role + pagination
  // ----------------------------------------------------------
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin gets all users (filterable + paginated)' })
  @ApiQuery({ name: 'name',   required: false, description: 'Filter by name (partial match)' })
  @ApiQuery({ name: 'email',  required: false, description: 'Filter by email (partial match)' })
  @ApiQuery({ name: 'role',   required: false, description: 'Filter by role: user | admin' })
  @ApiQuery({ name: 'skip',   required: false, description: 'Number of records to skip' })
  @ApiQuery({ name: '_limit', required: false, description: 'Max records to return' })
  @ApiQuery({ name: 'sort',   required: false, description: 'Sort direction: asc | desc' })
  @ApiResponse({ status: 200, description: 'List of users returned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden – admin access only' })

  findAll(@Query() query: UsersQueryDto) {
    return this.usersService.findAll(query);
  }

  // ----------------------------------------------------------
  // GET SINGLE USER
  // GET /users/:id
  // ----------------------------------------------------------
  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin gets a single user by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user' })
  @ApiResponse({ status: 200, description: 'User found successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // ----------------------------------------------------------
  // UPDATE USER
  // PATCH /users/:id
  // ----------------------------------------------------------
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin updates a user by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  // ----------------------------------------------------------
  // DELETE USER
  // DELETE /users/:id

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin deletes a user by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

// ============================================================
// USER ME CONTROLLER  →  base route: /userMe
// For authenticated users to manage their OWN account
// Uses req.user (from JWT token) instead of URL params for identity
// ============================================================
@ApiTags('User – Me')
@ApiBearerAuth('JWT-auth')
@Controller('userMe')
export class UserMeController {
  constructor(private readonly usersServices: UsersService) {}

  // ----------------------------------------------------------
  // GET MY PROFILE
  // GET /userMe
  // ----------------------------------------------------------
  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get the currently logged-in user profile' })
  @ApiResponse({ status: 200, description: 'Profile returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@Req() req: Request & { user: JwtPayload }) {
    console.log(req)
    return this.usersServices.getMe(req.user);
  }

  // ----------------------------------------------------------
  // UPDATE MY PROFILE
  // PATCH /userMe
  // forbidNonWhitelisted: true → rejects any extra fields not in UpdateUserDto
  // ----------------------------------------------------------
  @Patch()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Update the currently logged-in user profile' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateMe(
    @Req() req: Request & { user: JwtPayload },
    @Body(new ValidationPipe({ forbidNonWhitelisted: true })) updateUserDto: UpdateUserDto,
  ) {
    return this.usersServices.updateMe(req.user, updateUserDto);
  }

  // ----------------------------------------------------------
  // DEACTIVATE MY ACCOUNT
  // DELETE /userMe
  // ----------------------------------------------------------
  @Delete()
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Deactivate the currently logged-in user account' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  deleteMe(@Req() req: Request & { user: JwtPayload }) {
    return this.usersServices.deleteMe(req.user);
  }

  // ----------------------------------------------------------
// UPLOAD MY AVATAR
// PATCH /userMe/avatar
// ----------------------------------------------------------
@Patch('avatar')
@Roles(UserRole.ADMIN, UserRole.USER)
@UseInterceptors(FileInterceptor('avatar'))
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      avatar: { type: 'string', format: 'binary' },
    },
  },
})
@ApiOperation({ summary: 'Upload/update the avatar of the logged-in user' })
@ApiResponse({ status: 200, description: 'Avatar updated successfully' })
uploadAvatar(
  @Req() req: Request & { user: JwtPayload },
  @UploadedFile() avatar: Express.Multer.File,
) {
  return this.usersServices.updateAvatar(req.user, avatar);
}
}