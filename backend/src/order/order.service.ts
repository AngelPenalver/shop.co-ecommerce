import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Product } from 'src/products/entities/product.entity';
import { OrderItem } from 'src/order-item/entities/order-item.entity';
import { CartItemService } from 'src/cart-item/cart-item.service';
import { StripeService } from 'src/stripe/stripe.service';
import { OnEvent } from '@nestjs/event-emitter';
import Stripe from 'stripe';
import { AddressService } from 'src/address/address.service';
import { first } from 'rxjs';
import OrderAddress from 'src/order-address/entities/order-address.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly cartItem: CartItemService,
    private readonly cartService: CartService,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly stripeService: StripeService,
    private readonly addressService: AddressService,
    @InjectRepository(OrderAddress)
    private readonly orderAddressRepository: Repository<OrderAddress>
  ) {}

  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto
  ): Promise<{ Order: Order; sessionId: string }> {
    // Obtener carrito del usuario
    const cart = await this.cartService.findOne(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cannot create order from an empty cart.');
    }

    // Obtener Entidad User
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    // Buscamos la direccion
    const selectedShippingAddress = await this.addressService.findOneById({
      userId,
      id: createOrderDto.addresId,
    });
    if (!selectedShippingAddress) {
      throw new NotFoundException(
        `Address with id ${createOrderDto.addresId} not found`
      );
    }

    const shippingAddressData = {
      first_name: selectedShippingAddress.first_name,
      last_name: selectedShippingAddress.last_name,
      address: selectedShippingAddress.address,
      city: selectedShippingAddress.city,
      state: selectedShippingAddress.state,
      country: selectedShippingAddress.country,
      zip_code: selectedShippingAddress.zipCode,
      phone_number: selectedShippingAddress.phoneNumber,
    };

    // Iniciar Transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let paymentIntentClientSecret: string | null = null;

    try {
      let calculatedSubtotal = 0;
      const orderItemsData: Partial<OrderItem>[] = [];
      const orderShippingAddress = queryRunner.manager.create(
        OrderAddress,
        shippingAddressData
      );

      for (const cartItem of cart.items) {
        const product = await this.productsService.findOneByIdInTransaction(
          queryRunner.manager,
          cartItem.product.id
        );

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${cartItem.product.id} not found during order creation.`
          );
        }
        if (product.stock < cartItem.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}`
          );
        }

        const priceAtOrder = Number(product.price);
        const itemSubtotal = priceAtOrder * cartItem.quantity;
        calculatedSubtotal += itemSubtotal;

        orderItemsData.push({
          product: product, // Asociar la entidad producto
          quantity: cartItem.quantity,
          unitPrice: priceAtOrder, // Guardar el precio unitario al momento
        });

        // Decrementar Stock
        const newStock = product.stock - cartItem.quantity;
        await queryRunner.manager.update(Product, product.id, {
          stock: newStock,
        });
      }

      // Calcular Totales Finales (envío, impuestos, etc.)
      const shippingCost = this.calculateShipping(createOrderDto); // Función de ejemplo
      const taxAmount = this.calculateTaxes(calculatedSubtotal, createOrderDto); // Función de ejemplo
      const totalAmount = calculatedSubtotal + shippingCost + taxAmount; // Simplificado

      const session = await this.stripeService.createCheckoutSession(
        'temp_order_id',
        totalAmount
      );

      // Crear la Entidad Order (DENTRO DE LA TRANSACCIÓN)
      const newOrder = queryRunner.manager.create(Order, {
        user: user,
        orderDate: new Date(),
        totalAmount: totalAmount,
        subtotal: calculatedSubtotal,
        orderStatus: 'pending', // O 'processing' si el pago es inmediato
        items: orderItemsData.map((itemData) =>
          queryRunner.manager.create(OrderItem, itemData)
        ), // Crear OrderItems aquí si usas cascada o guardas por separado
        paymentStatus: 'pending',
        paymentMethod: 'credit_card',
        transactionId: session.id,
        shippingAddress: orderShippingAddress,
      });

      // Guardar la Orden y sus Items
      const savedOrder = await queryRunner.manager.save(Order, newOrder);

      await this.cartItem.removeAllItemsInTransaction(
        queryRunner.manager,
        cart.id
      );

      //  Commit de la Transacción
      await queryRunner.commitTransaction();

      //  Retornar la orden creada (podrías querer recargarla para obtener todas las relaciones bien)
      const orderWithRelations = await await this.orderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['user', 'items', 'items.product', 'shippingAddress'],
      });
      if (!orderWithRelations) {
        throw new NotFoundException(`Order with id ${savedOrder.id} not found`);
      }
      return {
        Order: orderWithRelations,
        sessionId: session.id,
      };
    } catch (error) {
      // Rollback en caso de error
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to create order for user ${userId}: ${error.message}`,
        error.stack
      );
      // Re-lanzar el error o lanzar uno más específico
      throw error;
    } finally {
      // Liberar el QueryRunner
      await queryRunner.release();
    }
  }

  // --- Funciones auxiliares de ejemplo ---
  private calculateShipping(dto: CreateOrderDto): number {
    /* Lógica de cálculo de envío */ return 5.0;
  }
  private calculateTaxes(subtotal: number, dto: CreateOrderDto): number {
    /* Lógica de impuestos */ return subtotal * 0.16;
  }

  private readonly logger = new Logger(OrderService.name);

  @OnEvent('payment.succeeded')
  async handlePaymentSucceededEvent(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(
      `Handling payment.succeeded event for PaymentIntent: ${paymentIntent.id}`
    );
    const order = await this.findOneByPaymentIntentId(paymentIntent.id);
    if (!order) {
      this.logger.error(
        `Order not found for successful PaymentIntent ID: ${paymentIntent.id}`
      );
      return;
    }

    // IDEMPOTENCIA: Chequear si ya está completado
    if (order.paymentStatus === 'completed') {
      this.logger.log(`Order ${order.id} already completed. Ignoring event.`);
      return;
    }

    order.paymentStatus = 'completed';
    order.orderStatus = 'processing';

    try {
      await this.orderRepository.save(order);
      this.logger.log(
        `Order ${order.id} updated to status ${order.orderStatus} / ${order.paymentStatus}.`
      );
    } catch (error) {
      this.logger.error(
        `Failed to save updated order ${order.id} after payment success: ${error.message}`,
        error.stack
      );
    }
  }

  // Listener para pago fallido
  @OnEvent('payment.failed')
  async handlePaymentFailedEvent(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(
      `Handling payment.failed event for PaymentIntent: ${paymentIntent.id}`
    );
    const order = await this.findOneByPaymentIntentId(paymentIntent.id);
    if (!order) {
      this.logger.warn(
        `Order not found for failed PaymentIntent ID: ${paymentIntent.id}`
      );
      return;
    }

    // IDEMPOTENCIA: Chequear si ya está fallido/cancelado
    if (order.paymentStatus === 'failed' || order.orderStatus === 'cancelled') {
      this.logger.log(
        `Order ${order.id} already failed/cancelled. Ignoring event.`
      );
      return;
    }

    order.paymentStatus = 'failed';
    order.orderStatus = 'cancelled';
    try {
      await this.orderRepository.save(order);
      this.logger.log(
        `Order ${order.id} updated to status ${order.orderStatus} / ${order.paymentStatus}.`
      );
    } catch (error) {
      this.logger.error(
        `Failed to save updated order ${order.id} after payment failure: ${error.message}`,
        error.stack
      );
    }
  }

  async findOneByPaymentIntentId(paymentId: string) {
    const order = await this.orderRepository.findOne({
      where: { transactionId: paymentId },
      relations: ['user', 'items', 'items.product'],
    });
    if (!order) {
      throw new NotFoundException(
        `Order with transaction ID ${paymentId} not found`
      );
    }
    return order;
  }

  async getAllOrdersByUser(userId: string): Promise<Order[]> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    const orders = await this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'items', 'items.product'],
    });
    if (!orders || orders.length === 0) {
      throw new NotFoundException(`No orders found for user with id ${userId}`);
    }
    return orders;
  }
}
