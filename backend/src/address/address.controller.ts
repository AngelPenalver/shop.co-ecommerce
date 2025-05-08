import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('address')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  /**
   * Crea una nueva dirección para el usuario autenticado.
   */
  @ApiOperation({ summary: 'Create address' })
  @ApiResponse({ status: 201, description: 'Create address' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Post()
  create(
    @Req() req,
    @Body() createAddressDto: CreateAddressDto
  ): Promise<Address> {
    const userId = req.user.id;
    return this.addressService.create(userId, createAddressDto);
  }

  /**
   * Obtiene todas las direcciones del usuario autenticado.
   */
  @ApiOperation({ summary: 'Get all addresses' })
  @ApiResponse({ status: 200, description: 'Addresses found' })
  @ApiResponse({ status: 404, description: 'Addresses not found' })
  @Get()
  findAll(@Req() req): Promise<Address[]> {
    const userId = req.user.id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.addressService.findAllForUser(userId);
  }

  /**
   * Obtiene una dirección específica del usuario autenticado por su ID numérico.
   */
  @ApiOperation({ summary: 'Get address by ID' })
  @ApiResponse({ status: 200, description: 'Address found' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @Get(':addressId')
  findOne(
    @Req() req,
    @Param('addressId', ParseIntPipe) addressId: number
  ): Promise<Address> {
    const userId = req.user.id;
    return this.addressService.findOneByIdForUser(userId, addressId);
  }

  /**
   * Actualiza una dirección específica del usuario autenticado.
   */
  @ApiOperation({ summary: 'Update address' })
  @ApiResponse({ status: 201, description: 'Address create' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @Patch(':addressId')
  update(
    @Req() req,
    @Param('addressId', ParseIntPipe) addressId: number,
    @Body() updateAddressDto: UpdateAddressDto
  ): Promise<Address> {
    const userId = req.user.id;
    return this.addressService.update(userId, addressId, updateAddressDto);
  }

  /**
   * Elimina una dirección específica del usuario autenticado.
   */
  @ApiOperation({ summary: 'Remove address' })
  @ApiResponse({ status: 200, description: 'Address remove' })
  @ApiResponse({ status: 404, description: 'Addresses not found' })
  @Delete(':addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() req,
    @Param('addressId', ParseIntPipe) addressId: number
  ): Promise<void> {
    const userId = req.user.id;
    return this.addressService.remove(userId, addressId);
  }
}
