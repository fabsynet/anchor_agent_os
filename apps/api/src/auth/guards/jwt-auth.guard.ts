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
    configService: ConfigService,
  ) {
    const supabaseUrl = configService.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    const serviceRoleKey = configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required',
      );
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
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

    // Validate token with Supabase (server-side verification)
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

    // Step 3: Query the users table (service_role bypasses RLS)
    if (!tenantId || !userRole) {
      const { data: dbUser, error: dbError } = await this.supabase
        .from('users')
        .select('tenant_id, role')
        .eq('id', supabaseUser.id)
        .single();

      if (dbError) {
        this.logger.warn(
          `DB lookup failed for user ${supabaseUser.id}: ${dbError.message}`,
        );
      }

      if (dbUser) {
        if (!tenantId) tenantId = dbUser.tenant_id;
        if (!userRole) userRole = dbUser.role;
      }
    }

    // Step 4: Auto-provision tenant + user if no record exists
    // This handles the case where the handle_new_user trigger didn't fire
    if (!tenantId) {
      this.logger.warn(
        `No tenant found for user ${supabaseUser.id} (${supabaseUser.email}). Auto-provisioning...`,
      );

      const email = supabaseUser.email || '';
      const name = supabaseUser.user_metadata?.full_name || email.split('@')[0];
      const slug = email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .substring(0, 30)
        + '-' + Date.now().toString(36);

      // Create tenant
      const { data: newTenant, error: tenantError } = await this.supabase
        .from('tenants')
        .insert({ name: `${name}'s Agency`, slug })
        .select('id')
        .single();

      if (tenantError || !newTenant) {
        this.logger.error(`Failed to create tenant: ${tenantError?.message}`);
        throw new UnauthorizedException(
          'Account setup incomplete. Please contact support.',
        );
      }

      tenantId = newTenant.id;

      // Determine role: no invitation_id = admin (organic signup)
      const isInvited = !!supabaseUser.user_metadata?.invitation_id;
      userRole = isInvited ? 'agent' : 'admin';

      // Parse name
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create user record
      const { error: userError } = await this.supabase
        .from('users')
        .insert({
          id: supabaseUser.id,
          tenant_id: tenantId,
          email,
          first_name: firstName,
          last_name: lastName,
          role: userRole,
          setup_completed: false,
        });

      if (userError) {
        this.logger.error(`Failed to create user record: ${userError.message}`);
        throw new UnauthorizedException(
          'Account setup incomplete. Please contact support.',
        );
      }

      this.logger.log(
        `Auto-provisioned tenant ${tenantId} and user ${supabaseUser.id}`,
      );
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
