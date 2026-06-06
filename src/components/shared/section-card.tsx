import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SectionCardProps extends PropsWithChildren {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  actions,
  className,
  children,
}: SectionCardProps) {
  return (
    <section className={cn("surface overflow-hidden", className)}>
      <div className="flex flex-col gap-4 border-b px-6 py-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
