import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('create/:userId')
  create(
    @Param('userId') userId: string,
    @Body() createOrderDto: CreateOrderDto
  ) {
    return this.orderService.createOrder(userId, createOrderDto);
  }
  @Get('payment/:userId')
  getByPayment(
    @Param('userId') userId: string,
    @Body('paymentId') paymentId: string
  ) {
    return this.orderService.findOneByPaymentIntentId(paymentId);
  }
  @Get(':userId')
  getAll(@Param('userId') userId: string) {
    return this.orderService.getAllOrdersByUser(userId);
  }
}
