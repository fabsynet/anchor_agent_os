import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { SearchTasksDto } from './dto/search-tasks.dto.js';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * GET /api/tasks/assignees
   * Return list of tenant users for the assignee dropdown.
   * No @Roles('admin') guard -- any authenticated user can call this.
   * IMPORTANT: This route MUST be declared BEFORE GET /tasks/:id
   * so NestJS doesn't interpret "assignees" as an :id param.
   */
  @Get('assignees')
  async getAssignees(@TenantId() tenantId: string) {
    return this.tasksService.getAssignees(tenantId);
  }

  /**
   * POST /api/tasks
   * Create a new task.
   */
  @Post()
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(tenantId, user.id, dto);
  }

  /**
   * GET /api/tasks
   * List/search tasks with query params. Returns paginated response.
   */
  @Get()
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: SearchTasksDto,
  ) {
    return this.tasksService.findAll(tenantId, query);
  }

  /**
   * GET /api/tasks/:id
   * Get a single task with relations.
   */
  @Get(':id')
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasksService.findOne(tenantId, id);
  }

  /**
   * PATCH /api/tasks/:id
   * Update a task (status changes, field edits).
   */
  @Patch(':id')
  async update(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(tenantId, id, user.id, dto);
  }

  /**
   * DELETE /api/tasks/:id
   * Delete a task.
   */
  @Delete(':id')
  async remove(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasksService.remove(tenantId, id, user.id);
  }
}
