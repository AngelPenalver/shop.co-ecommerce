import { Cart } from '../entities/cart.entity';

export class ResponseCartDto {
  message: string;
  cart: Cart;
}
