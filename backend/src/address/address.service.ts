import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { DataSource, Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly userService: UsersService,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Crea una nueva dirección para un usuario específico.
   */
  async create(
    userId: string,
    createAddressDto: CreateAddressDto
  ): Promise<Address> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const user = await this.userService.findOneByIdWithManager(
        userId,
        transactionalEntityManager
      );

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (createAddressDto.isDefault) {
        await transactionalEntityManager.update(
          Address,
          { user: { id: userId }, isDefault: true },
          { isDefault: false }
        );
      }

      const newAddressEntity = transactionalEntityManager.create(Address, {
        ...createAddressDto,
        user: user,
      });

      return transactionalEntityManager.save(newAddressEntity);
    });
  }
  /**
   * Busca todas las direcciones de un usuario específico.
   */
  async findAllForUser(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { user: { id: userId } },
      order: { id: 'ASC' },
    });
  }

  /**
   * Busca una dirección específica por su ID, asegurándose de que pertenezca al usuario dado.
   */
  async findOneByIdForUser(
    userId: string,
    addressId: number
  ): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, user: { id: userId } },
    });
    if (!address) {
      throw new NotFoundException(
        `Address with ID ${addressId} not found or does not belong to the user.`
      );
    }
    return address;
  }

  /**
   * Actualiza una dirección específica, verificando la propiedad del usuario.
   */
  async update(
    userId: string,
    addressId: number,
    updateAddressDto: UpdateAddressDto
  ): Promise<Address> {
    const address = await this.findOneByIdForUser(userId, addressId);
    const updatedAddressData = await this.addressRepository.preload({
      id: addressId,
      ...updateAddressDto,
    });

    if (!updatedAddressData) {
      throw new NotFoundException(
        `Could not preload data for address with ID ${addressId}`
      );
    }

    return this.addressRepository.save(updatedAddressData);
  }

  /**
   * Elimina una dirección específica, verificando la propiedad del usuario.
   */
  async remove(userId: string, addressId: number): Promise<void> {
    const address = await this.findOneByIdForUser(userId, addressId);

    await this.addressRepository.remove(address);
  }

  /**
   * Busca la dirección por defecto de un usuario específico.
   */

  async findByDefaultAddress(userId: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { user: { id: userId }, isDefault: true },
    });

    if (!address) {
      throw new NotFoundException(
        `Default address not found for user ID ${userId}.`
      );
    }

    return address;
  }

  /**
   * Actualiza la dirección por defecto de un usuario específico.
   */
  async updateDefaultAddress(
    userId: string,
    addressId: number
  ): Promise<Address> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const address = await queryRunner.manager.findOne(Address, {
        where: { id: addressId, user: { id: userId } },
      });

      if (!address) {
        throw new NotFoundException(
          `Address with ID ${addressId} not found for user ID ${userId}.`
        );
      }

      if (address.isDefault) {
        await queryRunner.commitTransaction();
        return address;
      }

      await queryRunner.manager.update(
        Address,
        { user: { id: userId }, isDefault: true },
        { isDefault: false }
      );

      address.isDefault = true;
      const updatedAddress = await queryRunner.manager.save(Address, address);

      await queryRunner.commitTransaction();
      return updatedAddress;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findOneByIdForService({
    userId,
    id,
  }: {
    userId: string;
    id: number;
  }): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id: id, user: { id: userId } },
    });
    if (!address) {
      throw new NotFoundException(
        `Address with ID ${id} not found for user ID ${userId}.`
      );
    }
    return address;
  }
}
