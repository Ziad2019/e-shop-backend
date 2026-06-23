import {
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


// ─── forgot-password.dto.ts ───────────────────────────────────────────────────
export class ForgotPasswordDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;
}