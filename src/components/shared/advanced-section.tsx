import type { PropsWithChildren } from "react";
import { ChevronRight } from "lucide-react";

interface AdvancedSectionProps extends PropsWithChildren {
  title: string;
  description?: string;
  defaultOpen?: boolean;
}

/**
 * Collapsible "advanced" disclosure built on the native <details> element.
 * Used to hide power-user fields (e.g. raw GL account pickers) from
 * non-accountant flows by default while keeping them available on demand.
 */
export function AdvancedSection({
  title,
  description,
  defaultOpen = false,
  children,
}: AdvancedSectionProps) {
  return (
    <details
      className="rounded-xl border border-border/70 bg-secondary/20 [&_summary]:list-none [&[open]_.advanced-chevron]:rotate-90"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-3 text-sm font-medium text-foreground">
        <ChevronRight className="advanced-chevron h-4 w-4 text-muted-foreground transition-transform" />
        <span>{title}</span>
      </summary>
      <div className="space-y-4 px-4 pb-4 pt-1">
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </div>
    </details>
  );
}
