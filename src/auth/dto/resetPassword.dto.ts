import {
   IsNotEmpty, IsString, MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ─── reset-password.dto.ts ────────────────────────────────────────────────────
export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}