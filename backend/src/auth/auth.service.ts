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
    // Valida si el usuario existe; si es así, se envía un error indicando que ya existe un usuario con esa dirección de correo electrónico.
    const userFound = await this.usersService.findOneByEmail(email);

    if (userFound) throw new BadRequestException('Email already exits');

    // La contraseña se hashea y el usuario se crea con la contraseña ya hasheada.
    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = await this.usersService.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
    });

    // Se cargan los datos para el token que se enviará.
    const payload = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      message: 'User created succesfully',
      email: user.email,
      token: token,
    };
  }

  async login({ email, password }: LoginDto): Promise<ResponseDto> {
    // Buscamos al usuario para ver si existe.
    const user = await this.usersService.findOneByEmail(email);

    // Si no existe, se envía un error de no autorizado.
    if (!user) throw new UnauthorizedException('Invalid email address');

    // Se valida la contraseña y, si no coincide con la contraseña del usuario, se envía un error de no autorizado.
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) throw new UnauthorizedException('Invalid password');

    // Se cargan los datos para el token que se enviará.
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
