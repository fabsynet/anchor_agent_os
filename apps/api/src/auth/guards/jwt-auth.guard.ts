import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClsService } from 'nestjs-cls';
import type { AuthenticatedUser } from '../strategies/supabase.strategy.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('supabase') {
  constructor(private readonly cls: ClsService) {
    super();
  }

  /**
   * After Passport validates the JWT and calls SupabaseStrategy.validate(),
   * this method sets the tenantId in the CLS context so PrismaService.tenantClient
   * can auto-scope queries to the correct tenant.
   */
  handleRequest<TUser = AuthenticatedUser>(
    err: any,
    user: TUser | false,
    _info: any,
    _context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }

    const authenticatedUser = user as unknown as AuthenticatedUser;

    // Set tenantId in async-local storage for PrismaService.tenantClient
    if (authenticatedUser.tenantId) {
      this.cls.set('tenantId', authenticatedUser.tenantId);
    }

    return user;
  }
}
