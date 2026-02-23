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
} from 'class-validator';
import { Type } from 'class-transformer';

class CustomLinkDto {
  @IsString()
  @MaxLength(50)
  label!: string;

  @IsUrl()
  url!: string;
}

export class CreateProfileDto {
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
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsUrl()
  linkedIn?: string;

  @IsOptional()
  @IsUrl()
  twitter?: string;

  @IsOptional()
  @IsUrl()
  facebook?: string;

  @IsOptional()
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
