import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';

// ============================================================
// UPDATE ORDER DTO
// All fields optional since we're doing partial updates.
// Imported from @nestjs/swagger to preserve @ApiProperty docs.
// ============================================================
export class UpdateOrderDto extends PartialType(CreateOrderDto) {}