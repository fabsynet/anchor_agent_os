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

      // Fetch profile directly from the users table via Supabase
      const { data: dbUser } = await supabase
        .from('users')
        .select('role, tenant_id, first_name, last_name, avatar_url, setup_completed')
        .eq('id', authUser.id)
        .single();

      if (dbUser) {
        setProfile({
          id: authUser.id,
          email: authUser.email ?? '',
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
          role: dbUser.role,
          tenantId: dbUser.tenant_id,
          avatarUrl: dbUser.avatar_url,
          setupCompleted: dbUser.setup_completed,
        });
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
