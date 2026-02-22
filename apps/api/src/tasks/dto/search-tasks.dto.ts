import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

const TASK_STATUSES = ['todo', 'in_progress', 'waiting', 'done'] as const;
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const TASK_TYPES = ['manual', 'renewal'] as const;

export class SearchTasksDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TASK_STATUSES, {
    message: `Status must be one of: ${TASK_STATUSES.join(', ')}`,
  })
  status?: (typeof TASK_STATUSES)[number];

  @IsOptional()
  @IsEnum(TASK_PRIORITIES, {
    message: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}`,
  })
  priority?: (typeof TASK_PRIORITIES)[number];

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  policyId?: string;

  @IsOptional()
  @IsEnum(TASK_TYPES, {
    message: `Type must be one of: ${TASK_TYPES.join(', ')}`,
  })
  type?: (typeof TASK_TYPES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
