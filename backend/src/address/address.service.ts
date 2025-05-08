import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly userService: UsersService
  ) {}

  /**
   * Crea una nueva dirección para un usuario específico.
   */
  async create(
    userId: string,
    createAddressDto: CreateAddressDto
  ): Promise<Address> {
    const user = await this.userService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const address = this.addressRepository.create({
      ...createAddressDto,
      user: user,
    });
    return this.addressRepository.save(address);
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
