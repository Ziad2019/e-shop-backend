import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================================
// DATE RANGE DTO
// Used for filtering sales statistics by period and year
// ============================================================
export class DateRangeDto {

  @ApiPropertyOptional({
    enum: ['daily', 'monthly', 'yearly'],
    default: 'monthly',
    description: 'How to group the sales data',
  })
  @IsEnum(['daily', 'monthly', 'yearly'], {
    message: 'Period must be daily, monthly, or yearly',
  })
  @IsOptional()
  period?: 'daily' | 'monthly' | 'yearly' = 'monthly';

  @ApiPropertyOptional({
    example: 2026,
    description: 'Year to filter by (default: current year)',
  })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  @Type(() => Number)
  year?: number;
}