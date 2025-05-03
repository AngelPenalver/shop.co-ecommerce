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
import { v4 as uuidv4 } from 'uuid';
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
      id: createOrderDto.addressId,
    });
    if (!selectedShippingAddress) {
      throw new NotFoundException(
        `Address with id ${createOrderDto.addressId} not found`
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
      const stripeLineItems: {
        name: string;
        unitPrice: number;
        quantity: number;
      }[] = [];
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

        stripeLineItems.push({
          name: product.name,
          unitPrice: priceAtOrder,
          quantity: cartItem.quantity,
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

      const newOrderId = uuidv4();

      const session = await this.stripeService.createCheckoutSession(
        newOrderId,
        stripeLineItems
      );
      // Extraer el ID del Payment Intent de forma segura
      let paymentIntentId: string | null = null;
      if (session.payment_intent) {
        if (typeof session.payment_intent === 'string') {
          paymentIntentId = session.payment_intent; // Ya es un string (ID)
        } else {
          // Es el objeto PaymentIntent expandido, obtenemos su ID
          paymentIntentId = session.payment_intent.id;
        }
      }

      // Crear la Entidad Order
      const newOrder = queryRunner.manager.create(Order, {
        id: newOrderId,
        user: user,
        orderDate: new Date(),
        totalAmount: totalAmount,
        subtotal: calculatedSubtotal,
        orderStatus: 'pending',
        items: orderItemsData.map((itemData) =>
          queryRunner.manager.create(OrderItem, itemData)
        ),
        paymentStatus: 'pending',
        paymentMethod: 'credit_card',
        transactionId: null,
        shippingAddress: orderShippingAddress,
      });

      this.logger.log(
        `Extracted PaymentIntent ID for new order: ${newOrderId}`
      );
      // Guardar la Orden y sus Items
      const savedOrder = await queryRunner.manager.save(Order, newOrder);

      await this.cartItem.removeAllItemsInTransaction(
        queryRunner.manager,
        cart.id
      );

      //  Commit de la Transacción
      await queryRunner.commitTransaction();

      //  Retornar la orden creada
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

  @OnEvent('checkout.session.completed')
  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(
      `Handling checkout.session.completed for Session ID: ${session.id}`
    );

    // --- 1. Extrae tu ID interno y el Payment Intent ID ---
    const internalOrderId = session.metadata?.internal_order_id;
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!internalOrderId) {
      this.logger.error(
        `Missing internal_order_id in metadata for checkout.session.completed: ${session.id}`
      );
      return;
    }
    if (!paymentIntentId) {
      this.logger.error(
        `Missing payment_intent ID in checkout.session.completed: ${session.id}`
      );
      return;
    }

    // Busca la orden usando TU ID interno (UUID) ---
    const order = await this.orderRepository.findOne({
      where: { id: internalOrderId },
    });

    if (!order) {
      this.logger.error(
        `Order with internal ID ${internalOrderId} (from metadata) not found. Webhook might be processed before order creation completed or ID mismatch.`
      );
      return;
    }

    //  Verifica si ya fue procesada
    if (order.paymentStatus === 'completed') {
      this.logger.log(
        `Order ${order.id} already marked as completed. Ignoring redundant checkout.session.completed event.`
      );
      return;
    }

    // Actualiza la orden con los datos del pago exitoso ---
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
        `Failed to save updated order ${order.id} after checkout.session.completed: ${error.message}`,
        error.stack
      );
    }
  }

  @OnEvent('payment_intent.succeeded')
  async handlePaymentSucceededEvent(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(
      `Handling payment.succeeded event for PaymentIntent: ${paymentIntent.id}`
    );

    // Intenta encontrar la orden por transactionId
    const order = await this.findOneByPaymentIntentId(paymentIntent.id);

    // Es normal que la orden no se encuentre si este evento llega antes que checkout.session.completed
    if (!order) {
      this.logger.warn(
        `Order not found for successful PaymentIntent ID: ${paymentIntent.id}. Possibly checkout.session.completed hasn't updated it yet.`
      );
      return; // No hagas nada más si no la encuentras
    }

    // Si la encuentra, verifica si ya está completada (idempotencia)
    if (order.paymentStatus === 'completed') {
      this.logger.log(
        `Order ${order.id} already completed. Ignoring redundant payment.succeeded event.`
      );
      return;
    }

    // Si por alguna razón checkout.session.completed falló pero este sí encuentra la orden
    // (y no está completada), puedes actualizarla aquí como respaldo.
    this.logger.log(
      `Updating order ${order.id} status via payment.succeeded as a fallback.`
    );
    order.paymentStatus = 'completed';
    order.orderStatus = 'processing';
    // El transactionId ya debería coincidir si la encontró

    try {
      await this.orderRepository.save(order);
      this.logger.log(
        `Order ${order.id} updated via payment.succeeded fallback to status ${order.orderStatus} / ${order.paymentStatus}.`
      );
    } catch (error) {
      this.logger.error(
        `Failed to save updated order ${order.id} via payment.succeeded fallback: ${error.message}`,
        error.stack
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
      // Si no la encuentra, puede ser que el checkout.session ni siquiera se completó
      // o que el ID aún no se guardó. Es menos crítico que en el caso de éxito.
      this.logger.warn(
        `Order not found for failed PaymentIntent ID: ${paymentIntent.id}. Cannot mark as failed.`
      );
      return; // Cambiado de 'return null' a 'return'
    }

    if (order.paymentStatus === 'failed' || order.orderStatus === 'cancelled') {
      this.logger.log(
        `Order ${order.id} already failed/cancelled. Ignoring payment.failed event.`
      );
      return; // Cambiado de 'return null' a 'return'
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
    console.log(`Searching for order with transactionId: ${paymentId}`);

    const order = await this.orderRepository.findOne({
      where: {
        transactionId: paymentId,
      },
      relations: ['user', 'items', 'items.product', 'shippingAddress'],
    });
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
      order: {
        orderDate: 'DESC',
      },
    });
    if (!orders || orders.length === 0) {
      throw new NotFoundException(`No orders found for user with id ${userId}`);
    }
    return orders;
  }
}
