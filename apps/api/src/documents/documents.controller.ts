import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { DocumentsService } from './documents.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';
import { UploadDocumentDto } from './dto/upload-document.dto.js';
import { SearchDocumentsDto } from './dto/search-documents.dto.js';

/**
 * Allowed MIME types for document upload.
 */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

@Controller('clients/:clientId/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * POST /api/clients/:clientId/documents
   * Upload one or more documents (max 10 files, 10MB each).
   */
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (
        _req: any,
        file: Express.Multer.File,
        cb: multer.FileFilterCallback,
      ) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
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
  async upload(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadDocumentDto,
  ) {
    return this.documentsService.uploadMany(
      tenantId,
      clientId,
      user.id,
      files,
      body.policyId,
      body.categories,
    );
  }

  /**
   * GET /api/clients/:clientId/documents
   * List documents for a client with optional policyId and category filters.
   */
  @Get()
  async findAll(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @TenantId() tenantId: string,
    @Query() query: SearchDocumentsDto,
  ) {
    return this.documentsService.findAll(tenantId, clientId, query);
  }

  /**
   * GET /api/clients/:clientId/documents/counts
   * Get document counts for badge display (total + per policy).
   */
  @Get('counts')
  async getCounts(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @TenantId() tenantId: string,
  ) {
    return this.documentsService.getDocumentCounts(tenantId, clientId);
  }

  /**
   * GET /api/clients/:clientId/documents/:documentId/url
   * Get a time-limited signed URL for downloading a document.
   */
  @Get(':documentId/url')
  async getSignedUrl(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @TenantId() tenantId: string,
  ) {
    return this.documentsService.getSignedUrl(tenantId, clientId, documentId);
  }

  /**
   * DELETE /api/clients/:clientId/documents/:documentId
   * Delete a document from storage and database.
   */
  @Delete(':documentId')
  async remove(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.remove(
      tenantId,
      clientId,
      user.id,
      documentId,
    );
  }
}
