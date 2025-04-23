import { forwardRef, Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { CartItemModule } from 'src/cart-item/cart-item.module';
import { CartModule } from 'src/cart/cart.module';
import { ProductsModule } from 'src/products/products.module';
import { UsersModule } from 'src/users/users.module';
import { StripeModule } from 'src/stripe/stripe.module';
import { AddressModule } from 'src/address/address.module';
import OrderAddress from 'src/order-address/entities/order-address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderAddress]),
    CartItemModule,
    CartModule,
    ProductsModule,
    UsersModule,
    StripeModule,
    AddressModule
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
