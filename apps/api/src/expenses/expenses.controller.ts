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
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage, type FileFilterCallback } from 'multer';
import { ExpensesService } from './expenses.service.js';
import { BudgetsService } from '../budgets/budgets.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { BadRequestException } from '@nestjs/common';

/**
 * Allowed MIME types for receipt upload.
 */
const RECEIPT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  private readonly logger = new Logger(ExpensesController.name);

  constructor(
    private readonly expensesService: ExpensesService,
    private readonly budgetsService: BudgetsService,
  ) {}

  // ─── 1. POST /api/expenses ──────────────────────────────

  /**
   * Create a new expense (status: draft).
   */
  @Post()
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(tenantId, user.id, dto);
  }

  // ─── 2. GET /api/expenses ──────────────────────────────

  /**
   * List expenses with pagination and filters.
   */
  @Get()
  async findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.expensesService.findAll(tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      category,
      dateFrom,
      dateTo,
    });
  }

  // ─── 3. GET /api/expenses/categories ───────────────────

  /**
   * Get preset + custom categories for this tenant.
   */
  @Get('categories')
  async getCategories(@TenantId() tenantId: string) {
    return this.expensesService.getCategories(tenantId);
  }

  // ─── 4. GET /api/expenses/pending-count ────────────────

  /**
   * Get count of pending_approval expenses (nav badge).
   */
  @Get('pending-count')
  async getPendingCount(@TenantId() tenantId: string) {
    return this.expensesService.getPendingCount(tenantId);
  }

  // ─── 12. GET /api/expenses/receipts/:receiptId/url ─────
  // NOTE: Placed BEFORE :id param routes to prevent route conflict

  /**
   * Get a signed download URL for a receipt.
   */
  @Get('receipts/:receiptId/url')
  async getReceiptUrl(
    @TenantId() tenantId: string,
    @Param('receiptId', ParseUUIDPipe) receiptId: string,
  ) {
    return this.expensesService.getReceiptSignedUrl(tenantId, receiptId);
  }

  // ─── 13. DELETE /api/expenses/receipts/:receiptId ──────
  // NOTE: Placed BEFORE :id param routes to prevent route conflict

  /**
   * Delete a receipt from storage and database.
   */
  @Delete('receipts/:receiptId')
  async deleteReceipt(
    @TenantId() tenantId: string,
    @Param('receiptId', ParseUUIDPipe) receiptId: string,
  ) {
    return this.expensesService.deleteReceipt(tenantId, receiptId);
  }

  // ─── 5. GET /api/expenses/:id ──────────────────────────

  /**
   * Get a single expense with receipts.
   */
  @Get(':id')
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.expensesService.findOne(tenantId, id);
  }

  // ─── 6. PATCH /api/expenses/:id ────────────────────────

  /**
   * Update an expense (only draft/rejected).
   */
  @Patch(':id')
  async update(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(tenantId, user.id, id, dto);
  }

  // ─── 7. DELETE /api/expenses/:id ────────────────────────

  /**
   * Delete an expense (only draft/rejected).
   */
  @Delete(':id')
  async remove(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.expensesService.delete(tenantId, user.id, id);
  }

  // ─── 8. POST /api/expenses/:id/submit ──────────────────

  /**
   * Submit expense for admin approval (draft -> pending_approval).
   */
  @Post(':id/submit')
  async submit(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.expensesService.submit(tenantId, user.id, id);
  }

  // ─── 9. POST /api/expenses/:id/approve ─────────────────

  /**
   * Admin-only: Approve a pending expense.
   */
  @Post(':id/approve')
  async approve(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (user.role !== 'admin') {
      throw new ForbiddenException(
        'Only admins can approve/reject expenses',
      );
    }
    const expense = await this.expensesService.approve(tenantId, user.id, id);

    // Trigger budget threshold check (fire-and-forget)
    this.budgetsService
      .checkBudgetThreshold(
        tenantId,
        expense.category,
        new Date(expense.date).getMonth() + 1,
        new Date(expense.date).getFullYear(),
      )
      .catch((err) =>
        this.logger.warn('Budget threshold check failed', err),
      );

    return expense;
  }

  // ─── 10. POST /api/expenses/:id/reject ─────────────────

  /**
   * Admin-only: Reject a pending expense with optional note.
   */
  @Post(':id/reject')
  async reject(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { rejectionNote?: string },
  ) {
    if (user.role !== 'admin') {
      throw new ForbiddenException(
        'Only admins can approve/reject expenses',
      );
    }
    return this.expensesService.reject(
      tenantId,
      user.id,
      id,
      body.rejectionNote,
    );
  }

  // ─── 11. POST /api/expenses/:id/receipts ───────────────

  /**
   * Upload up to 5 receipt files to an expense.
   */
  @Post(':id/receipts')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (
        _req: any,
        file: { mimetype: string; originalname: string },
        cb: FileFilterCallback,
      ) => {
        if (
          [
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/pdf',
          ].includes(file.mimetype)
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `File type ${file.mimetype} not allowed`,
            ) as any,
          );
        }
      },
    }),
  )
  async uploadReceipts(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles()
    files: Array<{
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    }>,
  ) {
    return this.expensesService.uploadReceipts(tenantId, id, files);
  }
}
