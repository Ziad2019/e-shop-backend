import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { WishlistService } from './wishlist.service'
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard' 
import { GetUser } from 'src/auth/decorators/get-user.decorator'   
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { UserRole } from '../users/users.schema'

@ApiTags('Wishlist')
@ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAccessGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get the logged-in user wishlist' })
  findMine(@GetUser() user: JwtPayload) {
    return this.wishlistService.findMine(user.id)
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Add a product to wishlist' })
  @ApiParam({ name: 'productId', description: 'MongoDB ObjectId of the product' })
  addProduct(@GetUser() user: JwtPayload, @Param('productId') productId: string) {
    return this.wishlistService.addProduct(user.id, productId)
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove a product from wishlist' })
  @ApiParam({ name: 'productId', description: 'MongoDB ObjectId of the product' })
  removeProduct(@GetUser() user: JwtPayload, @Param('productId') productId: string) {
    return this.wishlistService.removeProduct(user.id, productId)
  }
}