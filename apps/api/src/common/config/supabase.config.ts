import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

/**
 * Creates a Supabase admin client using the service role key.
 * Used for server-side admin operations like inviteUserByEmail.
 * NEVER expose the service role key to the frontend.
 */
export function createSupabaseAdmin(configService: ConfigService): SupabaseClient {
  const url = configService.get<string>('SUPABASE_URL');
  const serviceRoleKey = configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables',
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
