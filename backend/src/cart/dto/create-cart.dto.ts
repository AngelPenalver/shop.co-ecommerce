import { IsInt, IsNotEmpty, IsPositive, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export class CreateCartDto {
  @ApiProperty({ description: 'User associated with the cart' })
  @IsNotEmpty()
  user: User;

  @ApiProperty({ description: 'Initial cart total', default: 0 })
  @IsPositive()
  total: number;
}

export class AddToCartDto {
  @ApiProperty({ description: 'ID of the product to add' })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ description: 'Quantity to add', default: 1 })
  @IsInt()
  @IsPositive()
  quantity: number;
}

export class RemoveFromCartDto {
  @ApiProperty({ description: 'ID of the product to remove' })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ description: 'Quantity to remove' })
  @IsInt()
  @IsPositive()
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New quantity for the item' })
  @IsInt()
  @IsPositive()
  quantity: number;
}

export class ResponseCartDto {
  @ApiProperty({ description: 'Operation result message' })
  message: string;

  @ApiProperty({ description: 'Cart data' })
  cart: any; 
}

export class CartQueryParamsDto {
  @ApiProperty({ description: 'User ID to filter carts', required: false })
  @IsUUID()
  userId?: string;
}