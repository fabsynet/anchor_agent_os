import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClsService } from 'nestjs-cls';
import { PrismaService } from '../../common/prisma/prisma.service.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId: string | undefined;
  role: string | undefined;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private supabase: SupabaseClient;

  constructor(
    private readonly cls: ClsService,
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

    // Use anon key — auth.getUser() validates the user's own token
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

    // Step 1: Try JWT custom claims (from custom_access_token_hook)
    let tenantId: string | undefined;
    let userRole: string | undefined;

    try {
      const payloadB64 = token.split('.')[1];
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
      tenantId = payload.tenant_id;
      userRole = payload.user_role;
    } catch {
      // JWT decode failed, continue to fallbacks
    }

    // Step 2: Try user_metadata
    if (!tenantId) {
      tenantId = supabaseUser.user_metadata?.tenant_id;
    }
    if (!userRole) {
      userRole = supabaseUser.user_metadata?.user_role || supabaseUser.user_metadata?.role;
    }

    // Step 3: Always check if user exists in DB (fills gaps + ensures user record)
    let dbUserExists = false;
    try {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: supabaseUser.id },
        select: { tenantId: true, role: true },
      });

      if (dbUser) {
        dbUserExists = true;
        if (!tenantId) tenantId = dbUser.tenantId;
        if (!userRole) userRole = dbUser.role;
      }
    } catch (err: any) {
      this.logger.warn(`DB lookup failed for user ${supabaseUser.id}: ${err.message}`);
    }

    // Step 4: Auto-provision tenant + user if no tenant found at all
    if (!tenantId) {
      this.logger.warn(
        `No tenant found for user ${supabaseUser.id} (${supabaseUser.email}). Auto-provisioning...`,
      );

      try {
        const email = supabaseUser.email || '';
        const name = supabaseUser.user_metadata?.full_name || email.split('@')[0];
        const slug = email
          .split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .substring(0, 30)
          + '-' + Date.now().toString(36);

        // Create tenant + user in a single transaction via Prisma
        const isInvited = !!supabaseUser.user_metadata?.invitation_id;
        const role = isInvited ? 'agent' : 'admin';
        const nameParts = name.split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';

        const tenant = await this.prisma.tenant.create({
          data: {
            name: `${firstName}'s Agency`,
            slug,
            users: {
              create: {
                id: supabaseUser.id,
                email,
                firstName,
                lastName,
                role,
                setupCompleted: false,
              },
            },
          },
        });

        tenantId = tenant.id;
        userRole = role;
        dbUserExists = true;

        this.logger.log(
          `Auto-provisioned tenant ${tenantId} and user ${supabaseUser.id}`,
        );
      } catch (err: any) {
        this.logger.error(`Failed to auto-provision: ${err.message}`);
        throw new UnauthorizedException(
          'Account setup incomplete. Please contact support.',
        );
      }
    }

    // Step 5: Ensure user record exists in DB (handles invited users with tenantId from metadata but no DB row)
    if (!dbUserExists && tenantId) {
      try {
        const email = supabaseUser.email || '';
        const metadata = supabaseUser.user_metadata || {};
        const firstName = metadata.first_name || metadata.full_name?.split(' ')[0] || email.split('@')[0];
        const lastName = metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || '';
        const role = userRole || (metadata.invitation_id ? 'agent' : 'admin');

        await this.prisma.user.create({
          data: {
            id: supabaseUser.id,
            tenantId,
            email,
            firstName,
            lastName,
            role: role as any,
            setupCompleted: false,
          },
        });

        if (!userRole) userRole = role;

        this.logger.log(
          `Created user record for ${supabaseUser.id} in tenant ${tenantId}`,
        );
      } catch (err: any) {
        // Ignore unique constraint violation (race condition — another request created it)
        if (!err.message?.includes('Unique constraint')) {
          this.logger.warn(`Failed to create user record: ${err.message}`);
        }
      }
    }

    // Final role fallback
    if (!userRole) {
      userRole = supabaseUser.user_metadata?.invitation_id ? 'agent' : 'admin';
    }

    const authenticatedUser: AuthenticatedUser = {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      tenantId,
      role: userRole,
    };

    // Attach user to request
    request.user = authenticatedUser;

    // Set tenantId in async-local storage for PrismaService.tenantClient
    if (authenticatedUser.tenantId) {
      this.cls.set('tenantId', authenticatedUser.tenantId);
    }

    return true;
  }
}
