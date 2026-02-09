import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface SupabaseJwtPayload {
  sub: string;
  email: string;
  tenant_id?: string;
  user_role?: string;
  aud: string;
  exp: number;
  iat: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId: string | undefined;
  role: string | undefined;
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('SUPABASE_JWT_SECRET');
    if (!secret) {
      throw new Error('SUPABASE_JWT_SECRET environment variable is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  /**
   * Validates the decoded JWT payload and returns the user object
   * that will be attached to request.user.
   *
   * tenant_id and user_role are injected into the JWT by the
   * custom_access_token_hook in Supabase.
   */
  async validate(payload: SupabaseJwtPayload): Promise<AuthenticatedUser> {
    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenant_id,
      role: payload.user_role,
    };
  }
}
