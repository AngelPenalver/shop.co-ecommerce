import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  subtitle: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsString()
  image: string;
}
