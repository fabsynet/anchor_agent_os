import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

export interface SuperAdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: true;
}

@Injectable()
export class SuperAdminGuard implements CanActivate {
  private readonly logger = new Logger(SuperAdminGuard.name);
  private supabase: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    const supabaseUrl = configService.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    const anonKey = configService.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !anonKey) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required',
      );
    }

    this.supabase = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const token = authHeader.substring(7);

    // Validate token with Supabase Auth API
    const {
      data: { user: supabaseUser },
      error,
    } = await this.supabase.auth.getUser(token);

    if (error || !supabaseUser) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Look up user in super_admins table
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { email: supabaseUser.email! },
    });

    if (!superAdmin || !superAdmin.isActive) {
      throw new ForbiddenException('Not a super-admin');
    }

    // Set request.user — does NOT set CLS tenantId (cross-tenant queries)
    request.user = {
      id: superAdmin.id,
      email: superAdmin.email,
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
      isSuperAdmin: true,
    } satisfies SuperAdminUser;

    return true;
  }
}
