'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@anchor/shared';
import type { User } from '@supabase/supabase-js';

interface UseUserReturn {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const supabase = createClient();

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setUser(authUser);

      // Fetch profile from NestJS API to get role and tenant info
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        // Extract role from JWT claims (custom_access_token_hook adds user_role)
        let jwtRole: string | undefined;
        try {
          const payload = JSON.parse(atob(session.access_token.split('.')[1]));
          jwtRole = payload.user_role;
        } catch {
          // JWT decode failed
        }

        // Attempt full profile from NestJS API, with fast abort if unreachable
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const profileData = await fetch(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal,
        })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
          .finally(() => clearTimeout(timeout));

        if (profileData) {
          setProfile(profileData);
        } else if (jwtRole) {
          // API unavailable — use JWT role as fallback
          setProfile({ role: jwtRole } as UserProfile);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Listen for auth state changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setProfile(null);
      } else {
        fetchUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  return {
    user,
    profile,
    isLoading,
    isAdmin: profile?.role === 'admin',
    refresh: fetchUser,
  };
}
