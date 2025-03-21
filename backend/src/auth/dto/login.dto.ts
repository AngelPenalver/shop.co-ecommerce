import { IsEmail, IsString, MinLength } from 'class-validator';
export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8, { message: 'the password must be a minimum of 8 characters long.' })
    password: string
}