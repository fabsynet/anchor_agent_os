import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';
import { CreateBudgetDto } from './dto/create-budget.dto.js';
import { UpdateBudgetDto } from './dto/update-budget.dto.js';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  /**
   * POST /api/budgets
   * Admin-only: Create a new budget.
   */
  @Post()
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBudgetDto,
  ) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can create budgets');
    }
    return this.budgetsService.create(tenantId, user.id, dto);
  }

  /**
   * GET /api/budgets
   * List all budgets. Available to all authenticated users.
   */
  @Get()
  async findAll(@TenantId() tenantId: string) {
    return this.budgetsService.findAll(tenantId);
  }

  /**
   * GET /api/budgets/active
   * Get active budgets with spending summaries.
   * NOTE: This route MUST be declared BEFORE GET /budgets/:id
   * so NestJS doesn't interpret "active" as an :id param.
   */
  @Get('active')
  async getActive(@TenantId() tenantId: string) {
    const budgets = await this.budgetsService.findActiveBudgets(tenantId);

    const results = await Promise.all(
      budgets.map(async (budget) => {
        const spending = await this.budgetsService.getSpendingSummary(
          tenantId,
          budget.id,
        );
        return { budget, spending };
      }),
    );

    return results;
  }

  /**
   * GET /api/budgets/:id
   * Get a single budget with spending summary.
   */
  @Get(':id')
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const budget = await this.budgetsService.findOne(tenantId, id);
    const spending = await this.budgetsService.getSpendingSummary(
      tenantId,
      id,
    );
    return { budget, spending };
  }

  /**
   * PATCH /api/budgets/:id
   * Admin-only: Update a budget.
   */
  @Patch(':id')
  async update(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can update budgets');
    }
    return this.budgetsService.update(tenantId, id, dto);
  }

  /**
   * DELETE /api/budgets/:id
   * Admin-only: Delete a budget.
   */
  @Delete(':id')
  async remove(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete budgets');
    }
    return this.budgetsService.delete(tenantId, id);
  }

  /**
   * POST /api/budgets/:id/renew
   * Admin-only: Manually renew a budget.
   */
  @Post(':id/renew')
  async renew(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can renew budgets');
    }
    return this.budgetsService.renew(tenantId, user.id, id);
  }
}
