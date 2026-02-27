import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  digestOptOut?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyBudgetAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyRenewalReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyTaskReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  emailRenewalReminders?: boolean;
}
