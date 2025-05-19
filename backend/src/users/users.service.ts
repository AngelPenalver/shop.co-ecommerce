import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { CartService } from 'src/cart/cart.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userModel: Repository<User>,
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService
  ) {}
  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.userModel.create(createUserDto);

    if (newUser) {
      await this.userModel.save(newUser);
      await this.cartService.create({ total: 0, user: newUser });
    }
    return await this.userModel.save(newUser);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const foundUser = await this.userModel.findOne({ where: { email } });
    return foundUser;
  }

  async findOneById(id: string): Promise<User | null> {
    return await this.userModel.findOne({ where: { id } });
  }
  async findOneByIdWithManager(
    id: string,
    manager: EntityManager
  ): Promise<User | null> {
    const user = await manager.findOne(User, {
      where: { id },
    });

    return user;
  }
}
