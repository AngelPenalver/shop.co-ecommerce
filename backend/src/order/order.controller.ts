import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('order')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('create')
  create(@Req() req, @Body() createOrderDto: CreateOrderDto) {
    const userId = req.user.id;
    return this.orderService.createOrder(userId, createOrderDto);
  }
  @Get('payment')
  getByPayment(@Req() req, @Body('paymentId') paymentId: string) {
    const userId = req.user.id;
    return this.orderService.findOneByPaymentIntentId(paymentId);
  }
  @Get(':userId')
  getAll(@Param('userId') userId: string) {
    return this.orderService.getAllOrdersByUser(userId);
  }
}
