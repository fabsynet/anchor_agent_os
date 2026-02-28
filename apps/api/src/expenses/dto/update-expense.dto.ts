import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const RECURRENCE_VALUES = ['weekly', 'monthly', 'yearly'] as const;

export class UpdateExpenseDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'Amount must be positive' })
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  amount?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  category?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(RECURRENCE_VALUES, {
    message: `Recurrence must be one of: ${RECURRENCE_VALUES.join(', ')}`,
  })
  recurrence?: (typeof RECURRENCE_VALUES)[number];

  @IsOptional()
  @IsUUID()
  budgetId?: string | null;
}
