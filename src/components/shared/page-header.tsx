import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border/80 pb-5 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
