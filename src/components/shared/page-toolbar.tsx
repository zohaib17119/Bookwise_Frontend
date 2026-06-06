import type { ReactNode } from "react";

interface PageToolbarProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function PageToolbar({ title, description, actions }: PageToolbarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
