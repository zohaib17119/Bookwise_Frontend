import type { PropsWithChildren } from "react";

interface FormSectionProps extends PropsWithChildren {
  title: string;
  description?: string;
}

export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className="space-y-4 border-b border-border/70 pb-6 last:border-b-0 last:pb-0">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
