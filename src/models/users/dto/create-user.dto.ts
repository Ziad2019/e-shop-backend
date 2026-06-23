import {
  IsBoolean, IsEmail, IsEnum, IsNumber,
  IsOptional, IsPhoneNumber, IsString,
  IsUrl, Length, MaxLength, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';
import { UserRole, UserGender } from '../users.schema';

// ============================================================
// CREATE USER DTO (Data Transfer Object)
// Validates the request body when creating a new user.
// class-validator decorators run BEFORE the service is called.
//
// @ApiProperty         → required field in Swagger UI
// @ApiPropertyOptional → optional field in Swagger UI
// ============================================================
export class CreateUserDto {

  // ----------------------------------------------------------
  // NAME – required, 3-30 characters
  // ----------------------------------------------------------
  @ApiProperty({
    example: 'Ahmed Mohamed',
    description: 'Full name of the user',
    minLength: 3,
    maxLength: 30,
  })
  @IsString({ message: i18nValidationMessage('dto.IS_STRING') })
  @MinLength(3, { message: i18nValidationMessage('dto.MinLength') })
  @MaxLength(30, { message: i18nValidationMessage('dto.MaxLength') })
  name: string;

  // ----------------------------------------------------------
  // EMAIL – required, valid email format
  // ----------------------------------------------------------
  @ApiProperty({
    example: 'ahmed@example.com',
    description: 'Unique email address for the account',
  })
  @IsEmail({}, { message: 'Email is not valid' })
  email: string;

  // ----------------------------------------------------------
  // PASSWORD – required, 3-20 characters
  // Will be hashed by the schema pre-save hook before storing
  // ----------------------------------------------------------
  @ApiProperty({
    example: 'P@ssw0rd123',
    description: 'Account password (will be hashed before saving)',
    minLength: 3,
    maxLength: 20,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(3,  { message: 'Password must be at least 3 characters' })
  @MaxLength(20, { message: 'Password must be at most 20 characters' })
  password: string;

  // ----------------------------------------------------------
  // ROLE – optional, defaults to 'user' in the schema
  // Using the UserRole enum ensures only valid values are accepted
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: UserRole.USER,
    enum: UserRole,
    description: 'Account role',
    default: UserRole.USER,
  })
  @IsEnum(UserRole, { message: 'Role must be "user" or "admin"' })
  @IsOptional()
  role?: UserRole;

  // ----------------------------------------------------------
  // AVATAR – optional, must be a valid URL
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL to profile image',
  })
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  @IsOptional()
  avatar?: string;

  // ----------------------------------------------------------
  // AGE – optional number
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: 25,
    description: 'User age',
  })
  @IsNumber({}, { message: 'Age must be a number' })
  @IsOptional()
  age?: number;

  // ----------------------------------------------------------
  // PHONE NUMBER – optional, Egyptian format (+201XXXXXXXXX)
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: '+201012345678',
    description: 'Egyptian phone number',
  })
  @IsPhoneNumber('EG', { message: 'Must be a valid Egyptian phone number' })
  @IsOptional()
  phoneNumber?: string;

  // ----------------------------------------------------------
  // ADDRESS – optional free text
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: '123 Nile Street, Cairo',
    description: 'User physical address',
  })
  @IsString({ message: 'Address must be a string' })
  @IsOptional()
  address?: string;

  // ----------------------------------------------------------
  // ACTIVE – optional boolean, defaults to true in schema
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: true,
    description: 'Whether the account is active',
    default: true,
  })
    @IsBoolean({ message: 'Active must be a boolean (true or false)' })
  @IsOptional()
  active?: boolean;

  // ----------------------------------------------------------
  // VERIFICATION CODE – optional, exactly 6 characters
  // Sent to the user's email to verify their account
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: '123456',
    description: 'Email verification code (exactly 6 characters)',
  })
  @IsString({ message: 'Verification code must be a string' })
  @Length(6, 6, { message: 'Verification code must be exactly 6 characters' })
  @IsOptional()
  verificationCode?: string;

  // ----------------------------------------------------------
  // GENDER – optional, must be 'male' or 'female'
  // Using the UserGender enum for type safety
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: UserGender.MALE,
    enum: UserGender,
    description: 'User gender',
  })
  @IsEnum(UserGender, { message: 'Gender must be "male" or "female"' })
  @IsOptional()
  gender?: UserGender;
}