import { Anchor } from "lucide-react";

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Anchor className="size-10 text-primary" strokeWidth={1.5} />
        <h1 className="text-xl font-semibold tracking-tight">Anchor</h1>
      </div>
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
