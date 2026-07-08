import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { getApiErrorMessage } from "@/lib/api/error";

interface ErrorStateProps {
  title: string;
  description?: string;
  error?: unknown;
  action?: ReactNode;
}

export function ErrorState({ title, description, error, action }: ErrorStateProps) {
  const resolvedDescription = description ?? (error ? getApiErrorMessage(error) : undefined);

  return (
    <div className="surface flex flex-col items-start gap-4 p-6">
      <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {resolvedDescription ? (
          <p className="mt-1 text-sm text-muted-foreground">{resolvedDescription}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
