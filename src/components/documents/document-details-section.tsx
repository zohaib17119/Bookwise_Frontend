import type { PropsWithChildren } from "react";
import { SectionCard } from "@/components/shared/section-card";

interface DocumentDetailsSectionProps extends PropsWithChildren {
  title: string;
  description?: string;
}

export function DocumentDetailsSection({
  title,
  description,
  children,
}: DocumentDetailsSectionProps) {
  return (
    <SectionCard description={description} title={title}>
      {children}
    </SectionCard>
  );
}
