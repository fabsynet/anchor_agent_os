import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { TimelineService } from '../timeline/timeline.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { SearchTasksDto } from './dto/search-tasks.dto.js';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly timelineService: TimelineService,
  ) {}

  /**
   * Create a new task.
   */
  async create(tenantId: string, userId: string, dto: CreateTaskDto) {
    // Strip empty strings to null for optional UUID fields and dueDate
    const assigneeId = dto.assigneeId || null;
    const clientId = dto.clientId || null;
    const policyId = dto.policyId || null;
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    const task = await this.prisma.tenantClient.task.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        status: dto.status ?? 'todo',
        priority: dto.priority ?? 'medium',
        type: 'manual',
        dueDate,
        assigneeId,
        clientId,
        policyId,
        createdById: userId,
      } as any,
    });

    this.logger.log(
      `Task created: ${task.id} "${dto.title}" by user ${userId}`,
    );

    // Log activity event if task is linked to a client
    if (clientId) {
      await this.timelineService.createActivityEvent(
        tenantId,
        clientId,
        userId,
        'task_created',
        `Created task: ${dto.title}`,
        { taskId: task.id, priority: dto.priority ?? 'medium' },
      );
    }

    return task;
  }

  /**
   * List tasks with search, filter, and pagination.
   */
  async findAll(tenantId: string, query: SearchTasksDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.policyId) {
      where.policyId = query.policyId;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      this.prisma.tenantClient.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          assignee: {
            select: { id: true, firstName: true, lastName: true },
          },
          client: {
            select: { id: true, firstName: true, lastName: true },
          },
          policy: {
            select: { id: true, type: true, carrier: true, policyNumber: true },
          },
        },
      }),
      // Manual tenantId for count() -- not covered by tenant extension
      this.prisma.task.count({ where: { tenantId, ...where } }),
    ]);

    return {
      data: tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single task by ID with relations.
   */
  async findOne(tenantId: string, id: string) {
    const task = await this.prisma.tenantClient.task.findFirst({
      where: { id },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true },
        },
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
        policy: {
          select: { id: true, type: true, carrier: true, policyNumber: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    return task;
  }

  /**
   * Update a task.
   * Renewal tasks (type === 'renewal') can only have their status changed.
   */
  async update(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateTaskDto,
  ) {
    const existing = await this.prisma.tenantClient.task.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    // Renewal tasks: only status changes allowed (dismissible only)
    if ((existing as any).type === 'renewal') {
      const contentFields = ['title', 'description', 'dueDate', 'priority'];
      const attemptedContentEdits = contentFields.filter(
        (field) => (dto as any)[field] !== undefined,
      );
      if (attemptedContentEdits.length > 0) {
        throw new BadRequestException(
          `Renewal tasks cannot be edited. Only status changes are allowed. Attempted to change: ${attemptedContentEdits.join(', ')}`,
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined)
      updateData.description = dto.description || null;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.dueDate !== undefined)
      updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.assigneeId !== undefined)
      updateData.assigneeId = dto.assigneeId || null;
    if (dto.clientId !== undefined)
      updateData.clientId = dto.clientId || null;
    if (dto.policyId !== undefined)
      updateData.policyId = dto.policyId || null;

    const updated = await this.prisma.tenantClient.task.update({
      where: { id },
      data: updateData as any,
    });

    // Log activity events for status changes
    const clientId = (existing as any).clientId || (updated as any).clientId;
    if (dto.status && dto.status !== (existing as any).status && clientId) {
      if (dto.status === 'done') {
        await this.timelineService.createActivityEvent(
          tenantId,
          clientId,
          userId,
          'task_completed',
          `Completed task: ${(existing as any).title}`,
          { taskId: id },
        );
      } else {
        await this.timelineService.createActivityEvent(
          tenantId,
          clientId,
          userId,
          'task_status_changed',
          `Task "${(existing as any).title}" status changed from ${(existing as any).status} to ${dto.status}`,
          { taskId: id, from: (existing as any).status, to: dto.status },
        );
      }
    }

    return updated;
  }

  /**
   * Delete a task.
   */
  async remove(tenantId: string, id: string, userId: string) {
    const existing = await this.prisma.tenantClient.task.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    await this.prisma.tenantClient.task.delete({
      where: { id },
    });

    return { deleted: true, id };
  }

  /**
   * Get all users in a tenant for the assignee dropdown.
   * Any authenticated user can call this (no admin restriction).
   */
  async getAssignees(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, firstName: true, lastName: true },
    });
  }
}
