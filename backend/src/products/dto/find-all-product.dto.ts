import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FindAllProductsDto {
  @IsOptional()
  @Type(() => Number) // Transforma el query param string a número
  @IsInt({ message: 'Page must be an integer.' })
  @Min(1, { message: 'Page must be at least 1.' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer.' })
  @Min(1, { message: 'Limit must be at least 1.' })
  @Max(100, { message: 'Limit cannot exceed 100.' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'SortBy must be a string.' })
  filterBy?: string = 'name';

  @IsOptional()
  @IsEnum(SortOrder, { message: 'SortOrder must be ASC or DESC.' })
  sortOrder?: SortOrder = SortOrder.ASC;
}
