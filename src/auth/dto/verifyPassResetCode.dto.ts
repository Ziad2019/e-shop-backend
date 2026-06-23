
import {
  IsString, 
} from 'class-validator';
import { ApiProperty,  } from '@nestjs/swagger';


// ─── verify-reset-code.dto.ts ─────────────────────────────────────────────────
import { Length } from 'class-validator';

export class VerifyResetCodeDto {
  @ApiProperty({ example: '123456', description: '6-digit reset code' })
  @IsString()
  @Length(6, 6)
  resetCode: string;
}
