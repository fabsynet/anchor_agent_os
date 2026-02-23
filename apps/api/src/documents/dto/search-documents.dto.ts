import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SearchDocumentsDto {
  @IsOptional()
  @IsUUID()
  policyId?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
