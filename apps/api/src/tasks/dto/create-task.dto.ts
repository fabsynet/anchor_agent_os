import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

const TASK_STATUSES = ['todo', 'in_progress', 'waiting', 'done'] as const;
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

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
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  policyId?: string;
}
