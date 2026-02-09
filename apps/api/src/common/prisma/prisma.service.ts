import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { createTenantExtension } from './prisma-tenant.extension.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly cls: ClsService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Returns a Prisma client with tenant-scoped queries.
   * Reads tenantId from the CLS (AsyncLocalStorage) context,
   * which is set by JwtAuthGuard on every authenticated request.
   *
   * Use this for all tenant-scoped operations.
   * Use the raw PrismaService (this) for cross-tenant admin operations.
   */
  get tenantClient() {
    const tenantId = this.cls.get('tenantId');
    if (!tenantId) {
      throw new Error('Tenant context not set. Ensure JwtAuthGuard is applied.');
    }
    return createTenantExtension(this, tenantId);
  }
}
