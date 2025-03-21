import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userModel: Repository<User>) {}
  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.userModel.create(createUserDto);
    return await this.userModel.save(newUser);
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const foundUser = await this.userModel.findOne({ where: { email } });
      return foundUser;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
