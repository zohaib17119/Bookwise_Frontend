import type { PropsWithChildren } from "react";

interface SettingsSectionCardProps extends PropsWithChildren {
  title: string;
  description?: string;
}

export function SettingsSectionCard({
  title,
  description,
  children,
}: SettingsSectionCardProps) {
  return (
    <section className="surface p-6">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
