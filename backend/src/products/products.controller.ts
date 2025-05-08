import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('product')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'Create product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req, @Body() createProductDto: CreateProductDto) {
    const userId = req.user.id;
    return this.productsService.create(createProductDto, userId);
  }

  @ApiOperation({ summary: 'Find all product' })
  @ApiResponse({ status: 200, description: 'Products found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @ApiOperation({ summary: 'Find product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOneById(+id);
  }

  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 201, description: 'Product update' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @ApiOperation({ summary: 'Remove product' })
  @ApiResponse({ status: 200, description: 'Product remove' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
