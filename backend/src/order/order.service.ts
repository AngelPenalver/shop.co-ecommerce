import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
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

  private readonly logger = new Logger(OrderService.name);

  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto
  ): Promise<{ Order: Order; sessionId: string }> {
    // 1. Validaciones Iniciales (Carrito, Usuario, Dirección)
    const cart = await this.cartService.findOne(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cannot create order from an empty cart.');
    }
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    const selectedShippingAddress =
      await this.addressService.findOneByIdForService({
        userId,
        id: createOrderDto.addressId,
      });
    if (!selectedShippingAddress) {
      throw new NotFoundException(
        `Address with id ${createOrderDto.addressId} not found`
      );
    }

    // Prepara datos de dirección para la orden
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

    // 2. Iniciar Transacción de Base de Datos
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3. Procesar Items y Calcular Totales (Dentro de la Transacción)
      let calculatedSubtotal = 0;
      const orderItemsData: Partial<OrderItem>[] = [];
      const stripeLineItems: {
        name: string;
        unitPrice: number;
        quantity: number;
      }[] = [];
      const productsToUpdateStock: { id: number; newStock: number }[] = [];

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

        // Prepara datos para OrderItem
        orderItemsData.push({
          product: product,
          quantity: cartItem.quantity,
          unitPrice: priceAtOrder,
        });

        // Prepara datos para Stripe
        stripeLineItems.push({
          name: product.name,
          unitPrice: priceAtOrder,
          quantity: cartItem.quantity,
        });

        // Prepara actualización de stock
        productsToUpdateStock.push({
          id: product.id,
          newStock: product.stock - cartItem.quantity,
        });
      }

      const shippingCost = this.calculateShipping(createOrderDto);
      const taxAmount = this.calculateTaxes(calculatedSubtotal, createOrderDto);
      const totalAmount = calculatedSubtotal + shippingCost + taxAmount;

      // 4. Crear y Guardar Entidad OrderAddress (Dentro de la Transacción)
      const orderShippingAddress = queryRunner.manager.create(
        OrderAddress,
        shippingAddressData
      );

      // 5. Crear y Guardar Entidad Order PRELIMINAR (Dentro de la Transacción)
      const preliminaryOrder = queryRunner.manager.create(Order, {
        user: user,
        orderDate: new Date(),
        totalAmount: totalAmount,
        subtotal: calculatedSubtotal,
        orderStatus: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'credit_card',
        transactionId: null,
        shippingAddress: orderShippingAddress,
        items: orderItemsData.map((itemData) =>
          queryRunner.manager.create(OrderItem, itemData)
        ),
      });

      this.logger.log(`Attempting to save preliminary order...`);
      const savedOrder = await queryRunner.manager.save(
        Order,
        preliminaryOrder
      ); // Guarda para obtener ID
      const internalOrderId = savedOrder.id;
      this.logger.log(
        `Preliminary order saved with internal ID: ${internalOrderId}`
      );

      // 6. Crear Sesión de Checkout de Stripe (Fuera de la Transacción DB, pero antes del commit)
      this.logger.log(
        `Creating Stripe Checkout Session for internal order ID: ${internalOrderId}`
      );
      const session = await this.stripeService.createCheckoutSession(
        internalOrderId,
        stripeLineItems
      );
      this.logger.log(`Stripe Session created: ${session.id}`);

      // 7. Actualizar Stock (Dentro de la Transacción)
      this.logger.log(
        `Updating stock for ${productsToUpdateStock.length} products...`
      );
      for (const productUpdate of productsToUpdateStock) {
        await queryRunner.manager.update(Product, productUpdate.id, {
          stock: productUpdate.newStock,
        });
      }
      this.logger.log('Stock updated.');

      // 8. Limpiar Carrito (Dentro de la Transacción)
      this.logger.log(`Removing items from cart ID: ${cart.id}`);
      await this.cartItem.removeAllItemsInTransaction(
        queryRunner.manager,
        cart.id
      );
      this.logger.log('Cart items removed.');

      // 9. Commit de la Transacción de Base de Datos
      this.logger.log(
        `Committing transaction for order ID: ${internalOrderId}`
      );
      await queryRunner.commitTransaction();
      this.logger.log(`Transaction committed successfully.`);

      // 10. Retornar la orden (ya guardada) y el Session ID de Stripe
      //     Recargar es opcional pero asegura que todas las relaciones estén cargadas
      const orderWithRelations = await this.orderRepository.findOne({
        where: { id: internalOrderId },
        relations: ['user', 'items', 'items.product', 'shippingAddress'],
      });
      if (!orderWithRelations) {
        this.logger.error(
          `Failed to reload order ${internalOrderId} after commit.`
        );
        throw new NotFoundException(
          `Order with id ${internalOrderId} created but could not be reloaded.`
        );
      }

      return {
        Order: orderWithRelations,
        sessionId: session.id,
      };
    } catch (error) {
      this.logger.error(
        `Transaction failed for user ${userId}: ${error.message}`,
        error.stack
      );
      await queryRunner.rollbackTransaction();
      this.logger.log('Transaction rolled back.');
      throw error;
    } finally {
      await queryRunner.release();
      this.logger.log('Query runner released.');
    }
  }

  // --- Funciones auxiliares ---
  private calculateShipping(dto: CreateOrderDto): number {
    return 5.0;
  }
  private calculateTaxes(subtotal: number, dto: CreateOrderDto): number {
    return subtotal * 0.16;
  }

  @OnEvent('checkout.session.completed')
  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(
      `Handling checkout.session.completed for Session ID: ${session.id}`
    );
    const internalOrderId = session.metadata?.internal_order_id;
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!internalOrderId || !paymentIntentId) {
      this.logger.error(
        `Webhook Error: Missing required data (internalOrderId or paymentIntentId) in checkout.session.completed: ${session.id}`,
        { internalOrderId, paymentIntentId }
      );
      return;
    }

    const order = await this.orderRepository.findOne({
      where: { id: internalOrderId },
    });
    if (!order) {
      this.logger.error(
        `Order with internal ID ${internalOrderId} (from metadata) not found. Webhook might be processed before order creation completed or ID mismatch.`
      );
      return;
    }

    if (order.paymentStatus === 'completed') {
      this.logger.log(
        `Order ${order.id} already marked as completed. Ignoring.`
      );
      return;
    }

    order.paymentStatus = 'completed';
    order.orderStatus = 'processing';
    order.transactionId = paymentIntentId;

    try {
      await this.orderRepository.save(order);
      this.logger.log(
        `Order ${order.id} updated successfully via checkout.session.completed. Transaction ID: ${paymentIntentId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to save updated order ${order.id}: ${error.message}`,
        error.stack
      );
    }
  }

  @OnEvent('payment_intent.succeeded')
  async handlePaymentSucceededEvent(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(
      `Handling payment.succeeded event for PaymentIntent: ${paymentIntent.id}. (Primarily for logging/backup)`
    );
    const order = await this.findOneByPaymentIntentId(paymentIntent.id);
    if (order && order.paymentStatus !== 'completed') {
      this.logger.warn(
        `Order ${order.id} found via payment.succeeded but not yet marked completed by checkout webhook. Updating as fallback.`
      );
      order.paymentStatus = 'completed';
      order.orderStatus = 'processing';
      // transactionId ya debería coincidir
      try {
        await this.orderRepository.save(order);
      } catch (error) {
        this.logger.error(
          `Failed to save order ${order.id} via payment.succeeded fallback: ${error.message}`,
          error.stack
        );
      }
    } else if (order) {
      this.logger.log(
        `Order ${order.id} already completed. Ignoring redundant payment.succeeded.`
      );
    } else {
      this.logger.warn(
        `Order not found for payment.succeeded ${paymentIntent.id}. Checkout webhook likely handles this.`
      );
    }
  }

  @OnEvent('payment.failed')
  async handlePaymentFailedEvent(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(
      `Handling payment.failed event for PaymentIntent: ${paymentIntent.id}`
    );
    const order = await this.findOneByPaymentIntentId(paymentIntent.id);
    if (!order) {
      this.logger.warn(
        `Order not found for failed PaymentIntent ID: ${paymentIntent.id}. Cannot mark as failed.`
      );
      return;
    }
    if (order.paymentStatus === 'failed' || order.orderStatus === 'cancelled') {
      this.logger.log(
        `Order ${order.id} already failed/cancelled. Ignoring payment.failed event.`
      );
      return;
    }
    order.paymentStatus = 'failed';
    order.orderStatus = 'cancelled';
    try {
      await this.orderRepository.save(order);
      this.logger.log(
        `Order ${order.id} updated to status ${order.orderStatus} / ${order.paymentStatus} due to payment failure.`
      );
    } catch (error) {
      this.logger.error(
        `Failed to save updated order ${order.id} after payment failure: ${error.message}`,
        error.stack
      );
    }
  }

  async findOneByPaymentIntentId(paymentId: string): Promise<Order | null> {
    if (!paymentId) {
      this.logger.warn(
        'findOneByPaymentIntentId called with null or undefined paymentId.'
      );
      return null;
    }
    this.logger.log(`Searching for order with transactionId: ${paymentId}`);
    const order = await this.orderRepository.findOne({
      where: { transactionId: paymentId },
      relations: ['user', 'items', 'items.product', 'shippingAddress'],
    });
    if (!order) {
      this.logger.warn(`Order with transactionId ${paymentId} not found.`);
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
      relations: ['user', 'items', 'items.product', 'shippingAddress'],
      order: {
        orderDate: 'DESC',
      },
    });

    return orders;
  }
}
