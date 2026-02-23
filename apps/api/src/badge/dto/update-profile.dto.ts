import {
  IsOptional,
  IsString,
  IsEmail,
  IsUrl,
  IsBoolean,
  IsArray,
  Matches,
  MaxLength,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

class CustomLinkDto {
  @IsString()
  @MaxLength(50)
  label!: string;

  @IsUrl()
  url!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsEmail()
  email?: string;

  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsUrl()
  website?: string;

  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsUrl()
  linkedIn?: string;

  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsUrl()
  twitter?: string;

  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsUrl()
  facebook?: string;

  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsUrl()
  instagram?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsApp?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productsOffered?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomLinkDto)
  customLinks?: CustomLinkDto[];

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'accentColor must be a valid hex color (e.g. #0f172a)' })
  accentColor?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
