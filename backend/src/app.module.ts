import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { User } from './users/entities/user.entity';
import { Cart } from './cart/entities/cart.entity';
import { Product } from './products/entities/product.entity';
import { CartModule } from './cart/cart.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { CartItemModule } from './cart-item/cart-item.module';
import { CartItem } from './cart-item/entities/cart-item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { OrderModule } from './order/order.module';
import { Order } from './order/entities/order.entity';
import { OrderItemModule } from './order-item/order-item.module';
import { OrderItem } from './order-item/entities/order-item.entity';
import { StripeModule } from './stripe/stripe.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AddressModule } from './address/address.module';
import { Address } from './address/entities/address.entity';
import { OrderAddressModule } from './order-address/order-address.module';
import { LocationsModule } from './locations/locations.module';
import OrderAddress from './order-address/entities/order-address.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [EventEmitterModule.forRoot(), ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService
      ): PostgresConnectionOptions => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [User, Product, Cart, CartItem, Order, OrderItem, Address, OrderAddress],
        synchronize: true,
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      }),
    }),
    UsersModule,
    ProductsModule,
    CartModule,
    AuthModule,
    CartItemModule,
    OrderModule,
    OrderItemModule,
    StripeModule,
    AddressModule,
    OrderAddressModule,
    LocationsModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService],
})
export class AppModule {}
