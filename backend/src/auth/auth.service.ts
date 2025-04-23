import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { ResponseDto } from './dto/response.dto';
import * as bcryptjs from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async register({
    email,
    password,
    first_name,
    last_name,
  }: RegisterDto): Promise<ResponseDto> {
    //it validates if the user exists, if it does, an error is sent saying that a user already exists with that email address
    const user = await this.usersService.findOneByEmail(email);

    if (user) throw new BadRequestException('Email already exits');

    //the password is hashed and the user is created with the password already hashed
    const hashedPassword = await bcryptjs.hash(password, 10);

    const userData = await this.usersService.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
    });

    //the data for the token to be sent is uploaded
    const payload = {
      id: userData.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      message: 'User created succesfully',
      email: userData.email,
      token: token,
    };
  }

  async login({ email, password }: LoginDto): Promise<ResponseDto> {
    //we search for the user to see if he exists
    const user = await this.usersService.findOneByEmail(email);

    //If it does not exist, an unauthorized is sent
    if (!user) throw new UnauthorizedException('Invalid email address');

    //the password is validated and if it does not match the user's password an unauthorized is sent.
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) throw new UnauthorizedException('Invalid password');

    //the data for the token to be sent is uploaded
    const payload = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      message: 'user successfully logged in',
      email: user.email,
      token: token,
    };
  }
}
