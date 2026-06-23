import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================================
// USERS QUERY DTO
// Validates and types the query parameters for GET /users
//
// Without this, 'query' in the controller was typed as 'any'
// which means no validation and no Swagger documentation
//
// @Type(() => Number) → transforms the string from the URL
//   into an actual number (query params are always strings by default)
// ============================================================
export class UsersQueryDto {

  // ----------------------------------------------------------
  // LIMIT – max number of results to return
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: 10,
    description: 'Maximum number of users to return',
    default: 10,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number) // transforms "10" (string) → 10 (number)
  _limit?: number;

  // ----------------------------------------------------------
  // SKIP – number of records to skip (for pagination)
  // Example: skip=10 & _limit=10 → returns page 2
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: 0,
    description: 'Number of users to skip (used for pagination)',
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  skip?: number;

  // ----------------------------------------------------------
  // SORT – sort direction by name
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: 'asc',
    description: 'Sort direction: "asc" or "desc"',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsEnum(['asc', 'desc'], { message: 'Sort must be "asc" or "desc"' })
  @IsOptional()
  sort?: 'asc' | 'desc';

  // ----------------------------------------------------------
  // FILTERS – partial string match (case-insensitive via RegExp)
  // ----------------------------------------------------------
  @ApiPropertyOptional({
    example: 'ahmed',
    description: 'Filter users by name (partial match)',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'ahmed@example.com',
    description: 'Filter users by email (partial match)',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'user',
    description: 'Filter users by role: "user" or "admin"',
  })
  @IsString()
  @IsOptional()
  role?: string;
}