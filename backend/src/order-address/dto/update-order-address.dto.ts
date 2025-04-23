import { PartialType } from '@nestjs/swagger';
import { CreateOrderAddressDto } from './create-order-address.dto';

export class UpdateOrderAddressDto extends PartialType(CreateOrderAddressDto) {}
