import {
  IsEmail,  IsNotEmpty, IsString, 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


// ─── login.dto.ts ─────────────────────────────────────────────────────────────
export class LoginDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}