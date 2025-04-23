import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from 'src/order-item/entities/order-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderItem])],
})
export class OrderItemModule {}
