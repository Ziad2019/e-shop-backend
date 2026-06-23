import { PartialType, OmitType } from '@nestjs/swagger';
// ⚠️ NOTE: Import PartialType from '@nestjs/swagger' (NOT '@nestjs/mapped-types')
//    The swagger version keeps all @ApiProperty() decorators in the generated docs
//    The mapped-types version would strip them from Swagger UI
import { CreateUserDto } from './create-user.dto';

// ============================================================
// UPDATE USER DTO
//
// PartialType(CreateUserDto) → makes ALL fields from CreateUserDto optional
// This means you can send only the fields you want to update
//
// OmitType is used to REMOVE fields that should NOT be updatable
// directly through this endpoint (e.g., password should have
// its own dedicated "change password" endpoint for security)
// ============================================================
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}