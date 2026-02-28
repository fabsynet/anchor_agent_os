import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createSupabaseAdmin } from '../common/config/supabase.config.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { addWeeks, addMonths, addYears, startOfDay } from 'date-fns';
import crypto from 'crypto';

const RECEIPTS_BUCKET = 'receipts';

const RECEIPT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const RECEIPT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Preset expense categories for Canadian insurance agencies.
 */
const EXPENSE_CATEGORIES = [
  { value: 'office_rent', label: 'Office Rent & Lease' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'technology', label: 'Technology & Software' },
  { value: 'marketing', label: 'Marketing & Advertising' },
  { value: 'licensing', label: 'Licensing & Regulatory Fees' },
  { value: 'eo_insurance', label: 'E&O Insurance' },
  { value: 'travel', label: 'Travel & Mileage' },
  { value: 'professional_development', label: 'Professional Development' },
  { value: 'salaries', label: 'Salaries & Commissions' },
  { value: 'client_entertainment', label: 'Client Entertainment' },
  { value: 'telephone', label: 'Telephone & Internet' },
  { value: 'postage', label: 'Postage & Shipping' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);
  private supabaseAdmin: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.supabaseAdmin = createSupabaseAdmin(this.configService);
    this.ensureBucket();
  }

  /**
   * Ensure the receipts storage bucket exists.
   */
  private async ensureBucket() {
    try {
      const { data, error } = await this.supabaseAdmin.storage.getBucket(
        RECEIPTS_BUCKET,
      );
      if (error && error.message?.includes('not found')) {
        const { error: createError } =
          await this.supabaseAdmin.storage.createBucket(RECEIPTS_BUCKET, {
            public: false,
          });
        if (createError) {
          this.logger.warn(
            `Failed to create storage bucket "${RECEIPTS_BUCKET}": ${createError.message}. You may need to create it manually in the Supabase Dashboard.`,
          );
        } else {
          this.logger.log(`Storage bucket "${RECEIPTS_BUCKET}" created.`);
        }
      } else if (!error && data) {
        this.logger.debug(`Storage bucket "${RECEIPTS_BUCKET}" already exists.`);
      }
    } catch (err: any) {
      this.logger.warn(
        `Could not verify storage bucket "${RECEIPTS_BUCKET}": ${err.message}`,
      );
    }
  }

  /**
   * Calculate the next occurrence date based on recurrence frequency.
   */
  private advanceDate(
    date: Date,
    recurrence: 'weekly' | 'monthly' | 'yearly',
  ): Date {
    switch (recurrence) {
      case 'weekly':
        return addWeeks(date, 1);
      case 'monthly':
        return addMonths(date, 1);
      case 'yearly':
        return addYears(date, 1);
    }
  }

  // ─── 1. CREATE ───────────────────────────────────────────

  /**
   * Create a new expense with status 'draft'.
   * If isRecurring, calculate nextOccurrence from date + recurrence.
   */
  async create(tenantId: string, userId: string, dto: CreateExpenseDto, userRole?: string) {
    const expenseDate = new Date(dto.date);
    const isAdmin = userRole === 'admin';

    const data: Record<string, unknown> = {
      amount: dto.amount,
      category: dto.category,
      date: expenseDate,
      description: dto.description || null,
      status: isAdmin ? 'approved' : 'draft',
      submittedById: userId,
      isRecurring: dto.isRecurring ?? false,
      recurrence: dto.recurrence || null,
      nextOccurrence: null,
      budgetId: dto.budgetId || null,
    };

    if (dto.isRecurring && dto.recurrence) {
      data.nextOccurrence = this.advanceDate(expenseDate, dto.recurrence);
    }

    const expense = await (this.prisma.tenantClient as any).expense.create({
      data: data as any,
      include: {
        submittedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        receipts: true,
      },
    });

    return expense;
  }

  // ─── 2. FIND ALL (PAGINATED) ────────────────────────────

  /**
   * List expenses with pagination and filters.
   * Uses raw this.prisma with manual tenantId for count().
   */
  async findAll(
    tenantId: string,
    query: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.dateFrom || query.dateTo) {
      const dateFilter: Record<string, unknown> = {};
      if (query.dateFrom) {
        dateFilter.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        dateFilter.lte = new Date(query.dateTo);
      }
      where.date = dateFilter;
    }

    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: {
          receipts: true,
          submittedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          budget: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── 3. FIND ONE ────────────────────────────────────────

  /**
   * Get a single expense with receipts, submittedBy, and approvedBy.
   */
  async findOne(tenantId: string, expenseId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, tenantId },
      include: {
        receipts: true,
        submittedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        budget: {
          select: { id: true, name: true },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    return expense;
  }

  // ─── 4. UPDATE ──────────────────────────────────────────

  /**
   * Update an expense. Only allowed if status is 'draft' or 'rejected'.
   * If editing a rejected expense, resets status to 'draft'.
   */
  async update(
    tenantId: string,
    userId: string,
    expenseId: string,
    dto: UpdateExpenseDto,
  ) {
    const existing = await this.prisma.expense.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    if (existing.status !== 'draft' && existing.status !== 'rejected') {
      throw new BadRequestException(
        'Cannot edit an expense that is pending approval or already approved',
      );
    }

    const data: Record<string, unknown> = {};

    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.description !== undefined) data.description = dto.description || null;
    if (dto.isRecurring !== undefined) data.isRecurring = dto.isRecurring;
    if (dto.recurrence !== undefined) data.recurrence = dto.recurrence || null;
    if (dto.budgetId !== undefined) data.budgetId = dto.budgetId || null;

    // If editing a rejected expense, reset status to draft
    if (existing.status === 'rejected') {
      data.status = 'draft';
      data.rejectionNote = null;
    }

    // Recalculate nextOccurrence if recurring fields changed
    const isRecurring = dto.isRecurring ?? existing.isRecurring;
    const recurrence = (dto.recurrence ?? existing.recurrence) as
      | 'weekly'
      | 'monthly'
      | 'yearly'
      | null;
    const expenseDate = dto.date ? new Date(dto.date) : existing.date;

    if (isRecurring && recurrence) {
      data.nextOccurrence = this.advanceDate(expenseDate, recurrence);
    } else if (!isRecurring) {
      data.nextOccurrence = null;
      data.recurrence = null;
    }

    const updated = await (this.prisma.tenantClient as any).expense.update({
      where: { id: expenseId },
      data: data as any,
      include: {
        receipts: true,
        submittedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return updated;
  }

  // ─── 5. DELETE ──────────────────────────────────────────

  /**
   * Delete an expense. Only allowed if status is 'draft' or 'rejected'.
   * Also deletes receipts from Supabase Storage (DB cascade handles records).
   */
  async delete(tenantId: string, userId: string, expenseId: string) {
    const existing = await this.prisma.expense.findFirst({
      where: { id: expenseId, tenantId },
      include: { receipts: true },
    });

    if (!existing) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    if (existing.status !== 'draft' && existing.status !== 'rejected') {
      throw new BadRequestException(
        'Cannot delete an expense that is pending approval or already approved',
      );
    }

    // Delete receipt files from Supabase Storage
    if (existing.receipts.length > 0) {
      const paths = existing.receipts.map((r: any) => r.storagePath);
      const { error: deleteError } = await this.supabaseAdmin.storage
        .from(RECEIPTS_BUCKET)
        .remove(paths);

      if (deleteError) {
        this.logger.warn(
          `Failed to delete receipt files from storage for expense ${expenseId}: ${deleteError.message}. Proceeding with DB deletion.`,
        );
      }
    }

    // Delete expense (cascades to ExpenseReceipt records)
    await (this.prisma.tenantClient as any).expense.delete({
      where: { id: expenseId },
    });

    return { deleted: true, id: expenseId };
  }

  // ─── 6. SUBMIT ─────────────────────────────────────────

  /**
   * Submit an expense for admin approval (draft -> pending_approval).
   */
  async submit(tenantId: string, userId: string, expenseId: string) {
    const existing = await this.prisma.expense.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    if (existing.status !== 'draft') {
      throw new BadRequestException(
        'Only draft expenses can be submitted for approval',
      );
    }

    const updated = await (this.prisma.tenantClient as any).expense.update({
      where: { id: expenseId },
      data: { status: 'pending_approval' } as any,
      include: {
        receipts: true,
        submittedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return updated;
  }

  // ─── 7. APPROVE ────────────────────────────────────────

  /**
   * Approve a pending expense. Sets approvedById, approvedAt, status='approved'.
   * Returns the approved expense for downstream budget threshold checks.
   */
  async approve(tenantId: string, adminUserId: string, expenseId: string) {
    const existing = await this.prisma.expense.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    if (existing.status !== 'pending_approval') {
      throw new BadRequestException(
        'Only pending expenses can be approved',
      );
    }

    const updated = await (this.prisma.tenantClient as any).expense.update({
      where: { id: expenseId },
      data: {
        status: 'approved',
        approvedById: adminUserId,
        approvedAt: new Date(),
      } as any,
      include: {
        receipts: true,
        submittedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return updated;
  }

  // ─── 8. REJECT ─────────────────────────────────────────

  /**
   * Reject a pending expense with optional rejection note.
   */
  async reject(
    tenantId: string,
    adminUserId: string,
    expenseId: string,
    rejectionNote?: string,
  ) {
    const existing = await this.prisma.expense.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    if (existing.status !== 'pending_approval') {
      throw new BadRequestException(
        'Only pending expenses can be rejected',
      );
    }

    const updated = await (this.prisma.tenantClient as any).expense.update({
      where: { id: expenseId },
      data: {
        status: 'rejected',
        rejectionNote: rejectionNote || null,
      } as any,
      include: {
        receipts: true,
        submittedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return updated;
  }

  // ─── 9. UPLOAD RECEIPTS ─────────────────────────────────

  /**
   * Upload multiple receipt files to Supabase Storage and create ExpenseReceipt records.
   */
  async uploadReceipts(
    tenantId: string,
    expenseId: string,
    files: Array<{
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    }>,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Verify expense exists and belongs to tenant
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!expense) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    const receipts = [];

    for (const file of files) {
      // Validate mime type
      if (!RECEIPT_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `File type ${file.mimetype} not allowed. Allowed: ${RECEIPT_ALLOWED_MIME_TYPES.join(', ')}`,
        );
      }

      // Validate file size
      if (file.size > RECEIPT_MAX_FILE_SIZE) {
        throw new BadRequestException(
          `File "${file.originalname}" exceeds max size of 10MB`,
        );
      }

      const uuid = crypto.randomUUID();
      const storagePath = `${tenantId}/expenses/${expenseId}/${uuid}-${file.originalname}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await this.supabaseAdmin.storage
        .from(RECEIPTS_BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        this.logger.error(
          `Failed to upload receipt "${file.originalname}": ${uploadError.message}`,
        );
        throw new BadRequestException(
          `Failed to upload receipt "${file.originalname}": ${uploadError.message}`,
        );
      }

      // Create ExpenseReceipt record using raw prisma with manual tenantId
      const receipt = await this.prisma.expenseReceipt.create({
        data: {
          expenseId,
          tenantId,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          storagePath,
        },
      });

      receipts.push(receipt);
    }

    return receipts;
  }

  // ─── 10. GET RECEIPT SIGNED URL ─────────────────────────

  /**
   * Get a signed URL for downloading a receipt (60 min expiry).
   */
  async getReceiptSignedUrl(tenantId: string, receiptId: string) {
    const receipt = await this.prisma.expenseReceipt.findFirst({
      where: { id: receiptId, tenantId },
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt ${receiptId} not found`);
    }

    const { data, error } = await this.supabaseAdmin.storage
      .from(RECEIPTS_BUCKET)
      .createSignedUrl(receipt.storagePath, 3600); // 60 minutes

    if (error) {
      this.logger.error(
        `Failed to create signed URL for receipt ${receiptId}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to generate download URL: ${error.message}`,
      );
    }

    return {
      url: data.signedUrl,
      mimeType: receipt.mimeType,
      fileName: receipt.fileName,
    };
  }

  // ─── 11. DELETE RECEIPT ─────────────────────────────────

  /**
   * Delete a receipt from Supabase Storage and database.
   */
  async deleteReceipt(tenantId: string, receiptId: string) {
    const receipt = await this.prisma.expenseReceipt.findFirst({
      where: { id: receiptId, tenantId },
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt ${receiptId} not found`);
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await this.supabaseAdmin.storage
      .from(RECEIPTS_BUCKET)
      .remove([receipt.storagePath]);

    if (deleteError) {
      this.logger.warn(
        `Failed to delete receipt file from storage for ${receiptId}: ${deleteError.message}. Proceeding with DB deletion.`,
      );
    }

    // Delete DB record
    await this.prisma.expenseReceipt.delete({
      where: { id: receiptId },
    });

    return { deleted: true, id: receiptId };
  }

  // ─── 12. GET CATEGORIES ─────────────────────────────────

  /**
   * Return preset categories merged with any custom categories used by this tenant.
   */
  async getCategories(tenantId: string) {
    // Get distinct categories used by this tenant
    const usedCategories = await this.prisma.expense.findMany({
      where: { tenantId },
      distinct: ['category'],
      select: { category: true },
    });

    const presetValues = new Set(EXPENSE_CATEGORIES.map((c) => c.value));
    const result = [...EXPENSE_CATEGORIES];

    // Add any custom categories not in presets
    for (const row of usedCategories) {
      if (!presetValues.has(row.category)) {
        result.push({
          value: row.category,
          label: row.category
            .split('_')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
        });
      }
    }

    return result;
  }

  // ─── 13. GET PENDING COUNT ──────────────────────────────

  /**
   * Count expenses with status 'pending_approval' for nav badge.
   * Uses raw this.prisma with manual tenantId.
   */
  async getPendingCount(tenantId: string) {
    const count = await this.prisma.expense.count({
      where: { tenantId, status: 'pending_approval' },
    });

    return { count };
  }

  // ─── 14. CREATE RECURRING EXPENSES FOR ALL TENANTS ──────

  /**
   * Called by cron job. No CLS context -- uses raw this.prisma.
   * Finds recurring expenses whose nextOccurrence <= today and creates child expenses.
   */
  async createRecurringExpensesForAllTenants(): Promise<void> {
    const today = startOfDay(new Date());

    // Find all recurring expenses due for creation
    const recurringExpenses = await this.prisma.expense.findMany({
      where: {
        isRecurring: true,
        nextOccurrence: { lte: today },
        recurrence: { not: null },
      },
    });

    this.logger.log(
      `Found ${recurringExpenses.length} recurring expenses due for creation`,
    );

    if (recurringExpenses.length === 0) return;

    // Group by tenantId for per-tenant transactions
    const byTenant = new Map<string, typeof recurringExpenses>();
    for (const expense of recurringExpenses) {
      const list = byTenant.get(expense.tenantId) || [];
      list.push(expense);
      byTenant.set(expense.tenantId, list);
    }

    let totalCreated = 0;

    for (const [tenantId, expenses] of byTenant) {
      try {
        const created = await this.prisma.$transaction(async (tx) => {
          let count = 0;

          for (const parent of expenses) {
            const recurrence = parent.recurrence as
              | 'weekly'
              | 'monthly'
              | 'yearly';
            const occurrenceDate = parent.nextOccurrence!;

            // Create child expense
            await tx.expense.create({
              data: {
                tenantId,
                amount: parent.amount,
                category: parent.category,
                description: parent.description,
                date: occurrenceDate,
                status: 'draft',
                submittedById: parent.submittedById,
                isRecurring: false,
                parentExpenseId: parent.id,
              },
            });

            // Advance parent's nextOccurrence
            const nextDate = this.advanceDate(occurrenceDate, recurrence);
            await tx.expense.update({
              where: { id: parent.id },
              data: { nextOccurrence: nextDate },
            });

            count++;
          }

          return count;
        });

        totalCreated += created;
      } catch (err: any) {
        this.logger.error(
          `Failed to create recurring expenses for tenant ${tenantId}: ${err.message}`,
        );
      }
    }

    this.logger.log(
      `Recurring expense creation complete. Created ${totalCreated} new expenses.`,
    );
  }
}
