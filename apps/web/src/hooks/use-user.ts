'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import type { UserProfile, UserRole } from '@anchor/shared';
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

      // Derive initial profile from auth metadata (immediate, no API call)
      const meta = authUser.user_metadata ?? {};
      const role = meta.invitation_id ? 'agent' : 'admin';

      setProfile({
        id: authUser.id,
        email: authUser.email ?? '',
        firstName: meta.firstName ?? meta.first_name ?? '',
        lastName: meta.lastName ?? meta.last_name ?? '',
        role,
        tenantId: meta.tenant_id ?? '',
        avatarUrl: null,
        setupCompleted: false,
      });

      // Enrich from backend API (goes through NestJS, not direct DB)
      try {
        const dbProfile = await api.get<{
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          role: UserRole;
          tenantId: string;
          avatarUrl: string | null;
          setupCompleted: boolean;
        }>('/api/auth/me');

        if (dbProfile) {
          setProfile({
            id: dbProfile.id,
            email: dbProfile.email,
            firstName: dbProfile.firstName,
            lastName: dbProfile.lastName,
            role: dbProfile.role,
            tenantId: dbProfile.tenantId,
            avatarUrl: dbProfile.avatarUrl,
            setupCompleted: dbProfile.setupCompleted,
          });
        }
      } catch {
        // Backend unreachable — keep metadata-derived profile
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
