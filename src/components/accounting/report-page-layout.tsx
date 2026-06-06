import type { ReactNode } from "react";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

interface ReportPageLayoutProps {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  content: ReactNode;
}

export function ReportPageLayout({
  title,
  description,
  eyebrow,
  actions,
  filters,
  content,
}: ReportPageLayoutProps) {
  return (
    <PageContainer
      header={
        <PageHeader
          actions={actions}
          description={description}
          eyebrow={eyebrow}
          title={title}
        />
      }
    >
      {filters}
      {content}
    </PageContainer>
  );
}
