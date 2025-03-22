import { Product } from "../entities/product.entity";

export class ProductResponseDto {
    message: string;
    product: Product;
}