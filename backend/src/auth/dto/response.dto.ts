export class UserResponseDto {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    create_at: Date;
    update_at: Date;
}
export class ResponseDto {
    message: string
    email: string;
    token: string
}