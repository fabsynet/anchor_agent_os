import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ImportService } from './import.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';
import { ImportBatchDto } from './dto/import-row.dto.js';

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  /**
   * POST /api/import/clients-policies
   * Import clients and policies from validated JSON rows.
   */
  @Post('clients-policies')
  async importClientsPolicies(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ImportBatchDto,
  ) {
    return this.importService.importClientsAndPolicies(
      tenantId,
      user.id,
      dto.rows,
    );
  }

  /**
   * GET /api/import/template
   * Download CSV template with expected headers and example rows.
   */
  @Get('template')
  async getTemplate(@Res() res: Response) {
    const csv = this.importService.getTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="import-template.csv"',
    );
    res.send(csv);
  }
}
