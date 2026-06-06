import type { PropsWithChildren } from "react";

interface FormFieldProps extends PropsWithChildren {
  label: string;
  error?: string;
  helperText?: string;
}

export function FormField({ label, error, helperText, children }: FormFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!error && helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </label>
  );
}
