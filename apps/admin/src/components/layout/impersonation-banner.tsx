'use client';

import { useEffect, useState } from 'react';
import { useImpersonation } from '@/components/impersonation/impersonation-provider';

export function ImpersonationBanner() {
  const { isImpersonating, targetAgency, expiresAt, endImpersonation } =
    useImpersonation();
  const [countdown, setCountdown] = useState('');
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (!isImpersonating || !expiresAt) return;

    function updateCountdown() {
      const remaining = new Date(expiresAt!).getTime() - Date.now();
      if (remaining <= 0) {
        setCountdown('Expired');
        return;
      }
      const minutes = Math.floor(remaining / 60_000);
      const seconds = Math.floor((remaining % 60_000) / 1000);
      setCountdown(`${minutes}m ${seconds.toString().padStart(2, '0')}s`);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isImpersonating, expiresAt]);

  if (!isImpersonating) return null;

  async function handleEnd() {
    setEnding(true);
    try {
      await endImpersonation();
    } catch {
      setEnding(false);
    }
  }

  return (
    <div className="z-50 flex items-center justify-between bg-amber-500 px-4 py-2 text-sm font-medium text-black">
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <span>
          Acting as <strong>{targetAgency}</strong>
        </span>
        {countdown && (
          <span className="ml-2 rounded bg-black/10 px-2 py-0.5 text-xs font-mono">
            {countdown}
          </span>
        )}
      </div>
      <button
        onClick={handleEnd}
        disabled={ending}
        className="rounded bg-black/20 px-3 py-1 text-xs font-medium transition hover:bg-black/30 disabled:opacity-50"
      >
        {ending ? 'Ending...' : 'End Session'}
      </button>
    </div>
  );
}
