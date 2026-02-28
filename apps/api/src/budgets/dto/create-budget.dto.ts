import {
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBudgetDto {
  @IsString()
  @MinLength(1, { message: 'Budget name is required' })
  @MaxLength(100)
  name!: string;

  @IsNumber()
  @Min(0.01, { message: 'Total limit must be positive' })
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  totalLimit!: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
