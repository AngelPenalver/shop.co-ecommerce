import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import {
  AddToCartDto,
  RemoveFromCartDto,
  UpdateCartItemDto,
} from './dto/create-cart.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Cart')
@Controller('carts')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ status: 200, description: 'Cart found' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  @Get('user')
  async getCart(@Req() req) {
    const userId = req.user.id;
    return this.cartService.findOne(userId);
  }

  @ApiOperation({ summary: 'Add product to cart' })
  @ApiResponse({ status: 201, description: 'Product added to cart' })
  @ApiResponse({
    status: 400,
    description: 'Invalid quantity or insufficient stock',
  })
  @ApiResponse({ status: 404, description: 'User or product not found' })
  @Post('user/items')
  @HttpCode(HttpStatus.CREATED)
  async addToCart(@Req() req, @Body() addToCartDto: AddToCartDto) {
    const userId = req.user.id;
    return this.cartService.addToCart(
      userId,
      addToCartDto.productId,
      addToCartDto.quantity
    );
  }

  @ApiOperation({ summary: 'Remove quantity of a product from cart' })
  @ApiResponse({ status: 200, description: 'Product quantity reduced' })
  @ApiResponse({ status: 400, description: 'Invalid quantity' })
  @ApiResponse({
    status: 404,
    description: 'Cart or product not found in cart',
  })
  @Put('user/items/remove')
  async removeFromCart(
    @Req() req,
    @Body() removeFromCartDto: RemoveFromCartDto
  ) {
    const userId = req.user.id;

    return this.cartService.removeFromCart(
      userId,
      removeFromCartDto.productId,
      removeFromCartDto.quantity
    );
  }

  @ApiOperation({ summary: 'Completely remove a product from cart' })
  @ApiResponse({ status: 200, description: 'Product removed from cart' })
  @ApiResponse({
    status: 404,
    description: 'Cart or product not found in cart',
  })
  @Delete('user/items/:productId')
  async removeItemCompletely(
    @Req() req,
    @Param('productId', ParseIntPipe) productId: number
  ) {
    const userId = req.user.id;

    return this.cartService.removeItemCompletely(userId, productId);
  }

  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Cart item updated' })
  @ApiResponse({ status: 400, description: 'Invalid quantity' })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  @Put('user/items/:productId')
  async updateCartItem(
    @Req() req,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() updateCartItemDto: UpdateCartItemDto
  ) {
    const userId = req.user.id;

    await this.cartService.removeItemCompletely(userId, productId);

    if (updateCartItemDto.quantity > 0) {
      return this.cartService.addToCart(
        userId,
        productId,
        updateCartItemDto.quantity
      );
    }

    return this.cartService.findOne(userId);
  }

  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  @Delete('user/items')
  async clearCart(@Req() req) {
    const userId = req.user.id;

    return this.cartService.clearCart(userId);
  }

  @ApiOperation({ summary: 'Delete cart' })
  @ApiResponse({ status: 204, description: 'Cart deleted' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  @Delete(':cartId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCart(@Param('cartId', ParseIntPipe) cartId: number) {
    await this.cartService.remove(cartId);
  }
}
