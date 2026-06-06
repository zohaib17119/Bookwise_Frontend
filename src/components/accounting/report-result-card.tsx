import type { PropsWithChildren } from "react";

interface ReportResultCardProps extends PropsWithChildren {
  title: string;
  description?: string;
}

export function ReportResultCard({
  title,
  description,
  children,
}: ReportResultCardProps) {
  return (
    <section className="surface p-5">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
