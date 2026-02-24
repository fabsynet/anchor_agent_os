import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
  IsEmail,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ImportRowDto {
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  firstName!: string;

  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  lastName!: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsString()
  @MinLength(1, { message: 'Policy type is required' })
  policyType!: string;

  @IsOptional()
  @IsString()
  carrier?: string;

  @IsOptional()
  @IsString()
  policyNumber?: string;

  @IsOptional()
  @IsString()
  premium?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class ImportBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportRowDto)
  @ArrayMinSize(1, { message: 'At least one row is required' })
  @ArrayMaxSize(5000, { message: 'Maximum 5000 rows per import' })
  rows!: ImportRowDto[];
}
