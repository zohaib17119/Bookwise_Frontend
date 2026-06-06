import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils/cn";

interface StatementSectionProps extends PropsWithChildren {
  title: string;
  className?: string;
}

export function StatementSection({
  title,
  className,
  children,
}: StatementSectionProps) {
  return (
    <section className={cn("rounded-2xl border border-border/70 bg-white p-5", className)}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h3>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}
