'use client';

interface ImpersonationBannerProps {
  agencyName?: string;
  onEndSession?: () => void;
}

export function ImpersonationBanner({
  agencyName,
  onEndSession,
}: ImpersonationBannerProps) {
  if (!agencyName) return null;

  return (
    <div className="flex items-center justify-between bg-amber-500 px-4 py-2 text-sm font-medium text-black">
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
          Acting as <strong>{agencyName}</strong>
        </span>
      </div>
      <button
        onClick={onEndSession}
        className="rounded bg-black/20 px-3 py-1 text-xs font-medium transition hover:bg-black/30"
      >
        End Session
      </button>
    </div>
  );
}
