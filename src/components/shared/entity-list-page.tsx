import type { ReactNode } from "react";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

interface EntityListPageProps {
  title: string;
  description: string;
  eyebrow?: string;
  headerActions?: ReactNode;
  toolbar?: ReactNode;
  content: ReactNode;
}

export function EntityListPage({
  title,
  description,
  eyebrow,
  headerActions,
  toolbar,
  content,
}: EntityListPageProps) {
  return (
    <PageContainer
      header={
        <PageHeader
          actions={headerActions}
          description={description}
          eyebrow={eyebrow}
          title={title}
        />
      }
    >
      {toolbar}
      {content}
    </PageContainer>
  );
}
