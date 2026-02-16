import { PrismaClient } from '@prisma/client';

/**
 * Creates a Prisma Client Extension that auto-injects tenantId
 * into all query where clauses and create data.
 *
 * This ensures tenant isolation at the ORM level -- every query
 * is automatically scoped to the current tenant without manual filtering.
 *
 * Note: findUnique is NOT overridden because its where clause only
 * accepts unique fields. Use findFirst with tenantId for tenant-scoped
 * unique lookups, or validate tenantId after fetching.
 */
export function createTenantExtension(prisma: PrismaClient, tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }: { args: any; query: any }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }: { args: any; query: any }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async create({ args, query }: { args: any; query: any }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
        async update({ args, query }: { args: any; query: any }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async delete({ args, query }: { args: any; query: any }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
    },
  });
}
