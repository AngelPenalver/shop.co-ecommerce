import { IsNumber, IsString, IsUUID } from "class-validator";

export class CreateProductDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsUUID()
    userId: string;

    @IsNumber()
    price: number;
}

