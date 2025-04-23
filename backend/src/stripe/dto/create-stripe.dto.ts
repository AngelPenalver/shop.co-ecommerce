import { IsDecimal } from 'class-validator';

export class CreateStripeDto {
  @IsDecimal()
  amount: number;
}
