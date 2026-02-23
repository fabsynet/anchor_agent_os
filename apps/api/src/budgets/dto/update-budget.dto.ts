import {
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BudgetCategoryDto } from './create-budget.dto.js';

export class UpdateBudgetDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'Total limit must be positive' })
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  totalLimit?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetCategoryDto)
  categories?: BudgetCategoryDto[];
}
