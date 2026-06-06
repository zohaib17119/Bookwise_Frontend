import type { PropsWithChildren, ReactNode } from "react";

interface AuthFormShellProps extends PropsWithChildren {
  title: string;
  description: string;
  footer?: ReactNode;
}

export function AuthFormShell({
  title,
  description,
  footer,
  children,
}: AuthFormShellProps) {
  return (
    <div className="surface w-full max-w-md p-8">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Bookwise
        </p>
        <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
      {footer ? <div className="mt-6 border-t pt-6 text-sm">{footer}</div> : null}
    </div>
  );
}
