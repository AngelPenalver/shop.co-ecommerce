import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';

@Injectable()
export class CartItemService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>
  ) {}

  /**
   * Crea un nuevo item de carrito (versión normal)
   */
  async create(createItemDto: any) {
    const item = this.cartItemRepository.create(createItemDto);
    return await this.cartItemRepository.save(item);
  }

  /**
   * Crea un nuevo item de carrito dentro de una transacción
   */
  async createInTransaction(
    transactionalEntityManager: EntityManager,
    createItemDto: any
  ) {
    const item = transactionalEntityManager.create(CartItem, createItemDto);
    return await transactionalEntityManager.save(CartItem, item);
  }

  /**
   * Actualiza un item de carrito (versión normal)
   */
  async update(id: number, updateData: Partial<CartItem>) {
    await this.cartItemRepository.update(id, updateData);
    const updatedItem = await this.cartItemRepository.findOneBy({ id });
    
    if (!updatedItem) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }
    
    return updatedItem;
  }

  /**
   * Actualiza un item de carrito dentro de una transacción
   */
  async updateInTransaction(
    transactionalEntityManager: EntityManager,
    id: number,
    updateData: Partial<CartItem>
  ) {
    await transactionalEntityManager.update(CartItem, id, updateData);
    const updatedItem = await transactionalEntityManager.findOneBy(CartItem, { id });
    
    if (!updatedItem) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }
    
    return updatedItem;
  }

  /**
   * Elimina un item de carrito (versión normal)
   */
  async remove(id: number): Promise<void> {
    const result = await this.cartItemRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }
  }

  /**
   * Elimina un item de carrito dentro de una transacción
   */
  async removeInTransaction(
    transactionalEntityManager: EntityManager,
    id: number
  ): Promise<void> {
    const result = await transactionalEntityManager.delete(CartItem, id);
    if (result.affected === 0) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }
  }

  /**
   * Elimina todos los items de un carrito (versión normal)
   */
  async removeAllItems(cartId: number): Promise<void> {
    await this.cartItemRepository.delete({ cart: { id: cartId } });
  }

  /**
   * Elimina todos los items de un carrito dentro de una transacción
   */
  async removeAllItemsInTransaction(
    transactionalEntityManager: EntityManager,
    cartId: number
  ): Promise<void> {
    await transactionalEntityManager.delete(CartItem, { cart: { id: cartId } });
  }

  /**
   * Encuentra un item por su ID (versión normal)
   */
  async findOneById(id: number): Promise<CartItem> {
    const item = await this.cartItemRepository.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }
    return item;
  }

  /**
   * Encuentra un item por su ID dentro de una transacción
   */
  async findOneByIdInTransaction(
    transactionalEntityManager: EntityManager,
    id: number
  ): Promise<CartItem> {
    const item = await transactionalEntityManager.findOneBy(CartItem, { id });
    if (!item) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }
    return item;
  }
}