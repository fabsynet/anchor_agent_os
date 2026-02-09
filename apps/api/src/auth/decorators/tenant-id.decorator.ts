import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the tenantId from the authenticated user on the request.
 *
 * Usage:
 *   @TenantId() tenantId: string
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenantId;
  },
);
