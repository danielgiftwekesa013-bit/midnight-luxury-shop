import type { ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { BottomNav } from "./BottomNav";

export function Screen({
  children,
  withNav = true,
  className = "",
}: {
  children: ReactNode;
  withNav?: boolean;
  className?: string;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <div
        className={`mx-auto w-full max-w-[430px] px-4 ${withNav ? "pb-28" : "pb-8"} pt-[max(env(safe-area-inset-top),0.75rem)] ${className}`}
      >
        {children}
      </div>
      {withNav && <BottomNav />}
    </div>
  );
}

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  const router = useRouter();
  return (
    <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
      <button
        aria-label="Go back"
        onClick={() => router.history.back()}
        className="press grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card"
      >
        <ChevronLeft className="size-5" />
      </button>
      <h1 className="truncate text-lg font-bold">{title}</h1>
      <div className="shrink-0">{action}</div>
    </header>
  );
}

export function EmptyState({
  title,
  hint,
  cta,
}: {
  title: string;
  hint: string;
  cta?: { to: string; label: string };
}) {
  return (
    <div className="animate-rise mt-24 text-center">
      <p className="text-base font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-[16rem] text-sm text-muted-foreground">{hint}</p>
      {cta && (
        <Link
          to={cta.to}
          className="btn-primary press mt-6 inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-semibold"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
