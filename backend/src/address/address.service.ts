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
  async create(
    userId: string,
    createAddressDto: CreateAddressDto
  ): Promise<Address> {
    // Check if the user exists
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

  async findAll(userId: string): Promise<Address[]> {
    // Check if the user exists
    const user = await this.userService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.addressRepository.find({
      where: { user: user },
    });
  }

  async findOne(id: number): Promise<Address> {
    const address = await this.addressRepository.findOne({ where: { id: id } });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  update(id: number, updateAddressDto: UpdateAddressDto) {
    return `This action updates a #${id} address`;
  }

  remove(id: number) {
    return `This action removes a #${id} address`;
  }

  async findOneById({
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
      throw new NotFoundException('Address not found');
    }
    return address;
  }
}
