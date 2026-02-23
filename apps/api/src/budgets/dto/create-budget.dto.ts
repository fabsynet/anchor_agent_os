import {
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsString,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class BudgetCategoryDto {
  @IsString()
  @MinLength(1, { message: 'Category name is required' })
  category!: string;

  @IsNumber()
  @Min(0.01, { message: 'Limit amount must be positive' })
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  limitAmount!: number;
}

export class CreateBudgetDto {
  @IsNumber()
  @Min(1)
  @Max(12)
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  month!: number;

  @IsNumber()
  @Min(2020)
  @Max(2100)
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  year!: number;

  @IsNumber()
  @Min(0.01, { message: 'Total limit must be positive' })
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  totalLimit!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetCategoryDto)
  categories?: BudgetCategoryDto[];
}
