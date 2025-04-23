import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import OrderAddress from './entities/order-address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderAddress])],
})
export class OrderAddressModule {}
