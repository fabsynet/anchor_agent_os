import {
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Budget name is required' })
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'Total limit must be positive' })
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  totalLimit?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
