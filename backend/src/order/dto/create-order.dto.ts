import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateOrderDto {
    @IsNotEmpty()
    @IsNumber()
    adddresId: number;
}
