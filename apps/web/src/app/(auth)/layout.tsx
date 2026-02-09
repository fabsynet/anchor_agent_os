import { Anchor } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel - hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center bg-gradient-to-b from-[#0f172a] to-[#020617] px-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <Anchor className="size-16 text-white" strokeWidth={1.5} />
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Anchor
          </h1>
          <p className="max-w-sm text-lg text-white/70">
            Your insurance agency, running on autopilot.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center bg-white px-6 py-12 dark:bg-[#020617] md:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
