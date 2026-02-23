import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createSupabaseAdmin } from '../common/config/supabase.config.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { TimelineService } from '../timeline/timeline.service.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const BUCKET_NAME = 'documents';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private supabaseAdmin: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly timelineService: TimelineService,
    private readonly configService: ConfigService,
  ) {
    this.supabaseAdmin = createSupabaseAdmin(this.configService);
    this.ensureBucket();
  }

  /**
   * Ensure the documents storage bucket exists.
   * If it doesn't, attempt to create it. Log a warning on failure.
   */
  private async ensureBucket() {
    try {
      const { data, error } = await this.supabaseAdmin.storage.getBucket(
        BUCKET_NAME,
      );
      if (error && error.message?.includes('not found')) {
        const { error: createError } =
          await this.supabaseAdmin.storage.createBucket(BUCKET_NAME, {
            public: false,
          });
        if (createError) {
          this.logger.warn(
            `Failed to create storage bucket "${BUCKET_NAME}": ${createError.message}. You may need to create it manually in the Supabase Dashboard.`,
          );
        } else {
          this.logger.log(`Storage bucket "${BUCKET_NAME}" created.`);
        }
      } else if (!error && data) {
        this.logger.debug(`Storage bucket "${BUCKET_NAME}" already exists.`);
      }
    } catch (err: any) {
      this.logger.warn(
        `Could not verify storage bucket "${BUCKET_NAME}": ${err.message}`,
      );
    }
  }

  /**
   * Upload multiple files to Supabase Storage and create Prisma Document records.
   * Logs document_uploaded activity event for each file.
   */
  async uploadMany(
    tenantId: string,
    clientId: string,
    userId: string,
    files: Express.Multer.File[],
    policyId?: string,
    categories?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Parse categories if provided (JSON string array)
    let parsedCategories: string[] = [];
    if (categories) {
      try {
        parsedCategories = JSON.parse(categories);
        if (!Array.isArray(parsedCategories)) {
          parsedCategories = [];
        }
      } catch {
        // Invalid JSON -- ignore, use default category
        parsedCategories = [];
      }
    }

    const documents = [];

    for (const file of files) {
      const uuid = crypto.randomUUID();
      const folder = policyId || 'general';
      const storagePath = `${tenantId}/${clientId}/${folder}/${uuid}-${file.originalname}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await this.supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        this.logger.error(
          `Failed to upload file "${file.originalname}": ${uploadError.message}`,
        );
        throw new BadRequestException(
          `Failed to upload file "${file.originalname}": ${uploadError.message}`,
        );
      }

      // Determine category -- use first parsed category or default to 'correspondence'
      const category =
        parsedCategories.length > 0 ? parsedCategories[0] : 'correspondence';

      // Create Prisma Document record
      const doc = await this.prisma.tenantClient.document.create({
        data: {
          clientId,
          policyId: policyId || null,
          uploadedById: userId,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          category: category as any,
          storagePath,
        } as any,
      });

      documents.push(doc);

      // Log activity event
      await this.timelineService.createActivityEvent(
        tenantId,
        clientId,
        userId,
        'document_uploaded',
        `Uploaded document: ${file.originalname}`,
        {
          documentId: doc.id,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          category,
        },
        policyId,
      );
    }

    return documents;
  }

  /**
   * List documents for a client, optionally filtered by policyId and category.
   * Returns flat list and grouped folder structure.
   */
  async findAll(
    tenantId: string,
    clientId: string,
    query?: { policyId?: string; category?: string },
  ) {
    const where: Record<string, unknown> = { clientId };

    if (query?.policyId) {
      where.policyId = query.policyId;
    }

    if (query?.category) {
      where.category = query.category;
    }

    const documents = await this.prisma.tenantClient.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { firstName: true, lastName: true } },
        policy: { select: { id: true, policyNumber: true, type: true } },
      },
    });

    // Group documents by policyId for folder structure
    const folderMap = new Map<
      string,
      { policyId: string | null; label: string; count: number }
    >();

    for (const doc of documents as any[]) {
      const key = doc.policyId || 'general';
      if (!folderMap.has(key)) {
        const label =
          doc.policyId && doc.policy
            ? `${doc.policy.type}${doc.policy.policyNumber ? ' - ' + doc.policy.policyNumber : ''}`
            : 'General';
        folderMap.set(key, {
          policyId: doc.policyId || null,
          label,
          count: 0,
        });
      }
      folderMap.get(key)!.count++;
    }

    const folders = Array.from(folderMap.values());

    return {
      data: documents,
      folders,
      total: documents.length,
    };
  }

  /**
   * Generate a time-limited signed URL for downloading a document.
   * URL expires in 300 seconds (5 minutes).
   */
  async getSignedUrl(tenantId: string, clientId: string, documentId: string) {
    const doc = await this.prisma.tenantClient.document.findFirst({
      where: { id: documentId, clientId },
    });

    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    const { data, error } = await this.supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl((doc as any).storagePath, 300);

    if (error) {
      this.logger.error(
        `Failed to create signed URL for document ${documentId}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to generate download URL: ${error.message}`,
      );
    }

    return {
      url: data.signedUrl,
      mimeType: (doc as any).mimeType,
      fileName: (doc as any).fileName,
    };
  }

  /**
   * Delete a document from Supabase Storage and Prisma.
   * Logs document_deleted activity event.
   */
  async remove(
    tenantId: string,
    clientId: string,
    userId: string,
    documentId: string,
  ) {
    const doc = await this.prisma.tenantClient.document.findFirst({
      where: { id: documentId, clientId },
    });

    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await this.supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([(doc as any).storagePath]);

    if (deleteError) {
      this.logger.warn(
        `Failed to delete file from storage for document ${documentId}: ${deleteError.message}. Proceeding with Prisma record deletion.`,
      );
    }

    // Delete Prisma record
    await this.prisma.tenantClient.document.delete({
      where: { id: documentId },
    });

    // Log activity event
    await this.timelineService.createActivityEvent(
      tenantId,
      clientId,
      userId,
      'document_deleted',
      `Deleted document: ${(doc as any).fileName}`,
      {
        documentId,
        fileName: (doc as any).fileName,
        mimeType: (doc as any).mimeType,
      },
      (doc as any).policyId,
    );

    return { deleted: true, id: documentId };
  }

  /**
   * Get document counts for a client (total + per policy).
   * Used for frontend badge display.
   */
  async getDocumentCounts(tenantId: string, clientId: string) {
    const documents = await this.prisma.tenantClient.document.findMany({
      where: { clientId },
      select: { policyId: true },
    });

    const total = documents.length;

    // Group by policyId
    const perPolicy = new Map<string, number>();
    let generalCount = 0;

    for (const doc of documents as any[]) {
      if (doc.policyId) {
        perPolicy.set(
          doc.policyId,
          (perPolicy.get(doc.policyId) || 0) + 1,
        );
      } else {
        generalCount++;
      }
    }

    const policyCounts = Array.from(perPolicy.entries()).map(
      ([policyId, count]) => ({ policyId, count }),
    );

    return {
      total,
      general: generalCount,
      perPolicy: policyCounts,
    };
  }
}
