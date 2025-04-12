import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { ResponseCartDto } from './dto/response-cart.dto';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { CartItemService} from '../cart-item/cart-item.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { Product } from 'src/products/entities/product.entity';
import { CartItem } from 'src/cart-item/entities/cart-item.entity';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(Cart) 
    private readonly cartRepository: Repository<Cart>,
    private readonly productsService: ProductsService,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    private readonly cartItemService: CartItemService,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Crea un nuevo carrito
   */
  async create(createCartDto: CreateCartDto): Promise<ResponseCartDto> {
    const cart = this.cartRepository.create(createCartDto);
    await this.cartRepository.save(cart);
    return { message: 'Cart created successfully', cart };
  }

  /**
   * Agrega un producto al carrito o incrementa su cantidad
   */
  async addToCart(
    userId: string,
    productId: number,
    quantity: number
  ): Promise<Cart> {
    this.validateQuantity(quantity);

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const { cart: userCart, product } = await this.validateCartAndProduct(
        userId,
        productId,
        transactionalEntityManager
      );

      if (product.stock < quantity) {
        throw new BadRequestException(
          `Only ${product.stock} units available, but requested ${quantity}`
        );
      }
      
      await this.addOrUpdateCartItem(
        userCart,
        productId,
        quantity,
        transactionalEntityManager
      );

      return this.updateAndReturnCart(
        userCart.id,
        transactionalEntityManager
      );
    });
  }

  /**
   * Elimina una cantidad específica de un producto del carrito
   */
  async removeFromCart(
    userId: string,
    productId: number,
    quantity: number
  ): Promise<Cart> {
    this.validateQuantity(quantity);

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const { cart: userCart, item: existingItem } = await this.validateCartItem(
        userId,
        productId,
        transactionalEntityManager
      );

      if (existingItem.quantity < quantity) {
        throw new BadRequestException(
          `Only ${existingItem.quantity} units in cart, but requested to remove ${quantity}`
        );
      }

      const newQuantity = existingItem.quantity - quantity;
      
      if (newQuantity <= 0) {
        await this.cartItemService.removeInTransaction(
          transactionalEntityManager,
          existingItem.id
        );
      } else {
        await this.cartItemService.updateInTransaction(
          transactionalEntityManager,
          existingItem.id,
          { quantity: newQuantity }
        );
      }

      return this.updateAndReturnCart(
        userCart.id,
        transactionalEntityManager
      );
    });
  }

  /**
   * Elimina completamente un producto del carrito
   */
  async removeItemCompletely(
    userId: string,
    productId: number
  ): Promise<Cart> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const { cart: userCart, item: existingItem } = await this.validateCartItem(
        userId,
        productId,
        transactionalEntityManager
      );

      await this.cartItemService.removeInTransaction(
        transactionalEntityManager,
        existingItem.id
      );

      return this.updateAndReturnCart(
        userCart.id,
        transactionalEntityManager
      );
    });
  }

  /**
   * Obtiene el carrito de un usuario con el total calculado
   */
  async findOne(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart for user ${userId} not found`);
    }

    cart.total = this.calculateCartTotal(cart);
    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Obtiene un carrito por su ID
   */
  async findOneById(id: number): Promise<Cart> {
    const cart = await this.cartRepository.findOne({ 
      where: { id },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with id ${id} not found`);
    }

    return cart;
  }

  /**
   * Vacía completamente el carrito
   */
  async clearCart(userId: string): Promise<Cart> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const cart = await transactionalEntityManager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['items'],
      });

      if (!cart) {
        throw new NotFoundException(`Cart for user ${userId} not found`);
      }

      await this.cartItemService.removeAllItemsInTransaction(
        transactionalEntityManager,
        cart.id
      );

      cart.total = 0;
      await transactionalEntityManager.save(Cart, cart);

      return cart;
    });
  }

  /**
   * Elimina un carrito completamente
   */
  async remove(id: number): Promise<void> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await this.cartItemService.removeAllItemsInTransaction(
        transactionalEntityManager,
        id
      );
      await transactionalEntityManager.delete(Cart, id);
    });
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Valida que la cantidad sea mayor que 0
   */
  private validateQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }
  }

  /**
   * Calcula el total del carrito
   */
  private calculateCartTotal(cart: Cart): number {
    if (!cart.items || cart.items.length === 0) return 0;

    return cart.items.reduce((sum, item) => {
      return sum + (Number(item.product.price) * item.quantity);
    }, 0);
  }

  /**
   * Valida el carrito y el producto, devuelve ambos
   */
  private async validateCartAndProduct(
    userId: string,
    productId: number,
    transactionalEntityManager
  ): Promise<{ cart: Cart; product: Product }> {
    let cart = await transactionalEntityManager.findOne(Cart, {
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      const user = await this.userService.findOneById(userId);
      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }
      cart = transactionalEntityManager.create(Cart, { user });
      await transactionalEntityManager.save(Cart, cart);
    }

    const product = await this.productsService.findOneById(productId);
    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    return { cart, product };
  }

  /**
   * Valida el carrito y el item, devuelve ambos
   */
  private async validateCartItem(
    userId: string,
    productId: number,
    transactionalEntityManager
  ): Promise<{ cart: Cart; item: CartItem }> {
    const cart = await transactionalEntityManager.findOne(Cart, {
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart for user ${userId} not found`);
    }

    const existingItem = cart.items?.find(item => item.product.id === productId);
    if (!existingItem) {
      throw new NotFoundException(`Product with id ${productId} not found in cart`);
    }

    return { cart, item: existingItem };
  }

  /**
   * Agrega o actualiza un item en el carrito
   */
  private async addOrUpdateCartItem(
    cart: Cart,
    productId: number,
    quantity: number,
    transactionalEntityManager
  ): Promise<void> {
    const existingItem = cart.items?.find(item => item.product.id === productId);

    if (existingItem) {
      if(existingItem.quantity + quantity > existingItem.product.stock) {
        throw new BadRequestException(
          `Only ${existingItem.product.stock} units available.`
        );
      }
      await this.cartItemService.updateInTransaction(
        transactionalEntityManager,
        existingItem.id, 
        { quantity: existingItem.quantity + quantity }
      );
    } else {
      const product = await this.productsService.findOneById(productId);
      await this.cartItemService.createInTransaction(
        transactionalEntityManager,
        {
          product,
          quantity,
          cart
        }
      );
    }
  }

  /**
   * Actualiza y devuelve el carrito con el total calculado
   */
  private async updateAndReturnCart(
    cartId: number,
    transactionalEntityManager
  ): Promise<Cart> {
    const updatedCart = await transactionalEntityManager.findOne(Cart, {
      where: { id: cartId },
      relations: ['items', 'items.product'],
    });

    if (!updatedCart) {
      throw new NotFoundException(`Cart with id ${cartId} not found`);
    }

    updatedCart.total = this.calculateCartTotal(updatedCart);
    await transactionalEntityManager.save(Cart, updatedCart);

    return updatedCart;
  }
}