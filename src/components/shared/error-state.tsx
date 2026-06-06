import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

interface ErrorStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <div className="surface flex flex-col items-start gap-4 p-6">
      <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
