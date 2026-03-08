'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ImpersonationSession } from '@anchor/shared';
import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

interface ImpersonationContextValue {
  isImpersonating: boolean;
  targetAgency: string | null;
  expiresAt: string | null;
  startImpersonation: (userId: string) => Promise<void>;
  endImpersonation: () => Promise<void>;
}

const ImpersonationContext = createContext<ImpersonationContextValue>({
  isImpersonating: false,
  targetAgency: null,
  expiresAt: null,
  startImpersonation: async () => {},
  endImpersonation: async () => {},
});

export function useImpersonation() {
  return useContext(ImpersonationContext);
}

const ADMIN_SESSION_KEY = 'anchor_admin_session';
const IMPERSONATION_KEY = 'anchor_impersonation';

interface StoredImpersonation {
  targetAgency: string;
  expiresAt: string;
  targetUserId: string;
}

export function ImpersonationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [targetAgency, setTargetAgency] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore impersonation state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(IMPERSONATION_KEY);
      if (stored) {
        const data: StoredImpersonation = JSON.parse(stored);
        const expiry = new Date(data.expiresAt);
        if (expiry > new Date()) {
          setIsImpersonating(true);
          setTargetAgency(data.targetAgency);
          setExpiresAt(data.expiresAt);
        } else {
          // Expired, clean up
          localStorage.removeItem(IMPERSONATION_KEY);
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Auto-expiry check every 60 seconds
  useEffect(() => {
    if (!isImpersonating || !expiresAt) return;

    intervalRef.current = setInterval(() => {
      const expiry = new Date(expiresAt);
      if (expiry <= new Date()) {
        endImpersonationInternal();
      }
    }, 60_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImpersonating, expiresAt]);

  const endImpersonationInternal = useCallback(async () => {
    try {
      const stored = localStorage.getItem(IMPERSONATION_KEY);
      if (stored) {
        const data: StoredImpersonation = JSON.parse(stored);
        await api.post('/admin/impersonation/end', {
          targetUserId: data.targetUserId,
        });
      }
    } catch {
      // Best effort
    }

    // Restore admin session from stored cookie
    try {
      const savedSession = localStorage.getItem(ADMIN_SESSION_KEY);
      if (savedSession) {
        const supabase = createClient();
        const { access_token, refresh_token } = JSON.parse(savedSession);
        await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
      }
    } catch {
      // If restore fails, user will need to re-login
    }

    // Clean up storage
    localStorage.removeItem(IMPERSONATION_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);

    setIsImpersonating(false);
    setTargetAgency(null);
    setExpiresAt(null);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Redirect back to admin users page
    window.location.href = '/users';
  }, []);

  const startImpersonation = useCallback(async (userId: string) => {
    const supabase = createClient();

    // Save current admin session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      localStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }),
      );
    }

    // Request impersonation from backend
    const result = await api.post<ImpersonationSession>(
      '/admin/impersonation/start',
      { targetUserId: userId },
    );

    // Store impersonation metadata
    const impersonationData: StoredImpersonation = {
      targetAgency: result.tenantName,
      expiresAt: result.expiresAt,
      targetUserId: userId,
    };
    localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(impersonationData));

    setIsImpersonating(true);
    setTargetAgency(result.tenantName);
    setExpiresAt(result.expiresAt);

    // Use verifyOtp with the magic link token to switch session
    if (result.tokenHash) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: result.tokenHash,
        type: 'magiclink',
      });

      if (error) {
        // Clean up on failure
        localStorage.removeItem(IMPERSONATION_KEY);
        throw new Error(`Failed to start impersonation: ${error.message}`);
      }
    }

    // Redirect to the tenant app
    const tenantAppUrl =
      process.env.NEXT_PUBLIC_TENANT_APP_URL || 'http://localhost:3000';
    window.location.href = tenantAppUrl;
  }, []);

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        targetAgency,
        expiresAt,
        startImpersonation,
        endImpersonation: endImpersonationInternal,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}
