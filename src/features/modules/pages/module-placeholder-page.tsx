import { ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";

interface ModulePlaceholderPageProps {
  title: string;
  description: string;
  moduleName: string;
}

export function ModulePlaceholderPage({
  title,
  description,
  moduleName,
}: ModulePlaceholderPageProps) {
  const { companyId } = useParams();

  return (
    <PageContainer
      header={
        <PageHeader
          title={title}
          description={description}
          eyebrow="Module foundation"
          actions={
            <Button asChild variant="secondary">
              <Link to={`/app/company/${companyId}/dashboard`}>Back to dashboard</Link>
            </Button>
          }
        />
      }
    >
      <SectionCard
        title={`${title} module scaffold`}
        description="This route exists now so company-scoped navigation, permissions, and feature rollout stay stable."
      >
        <EmptyState
          title={`${title} is ready for Phase 3`}
          description={`The ${moduleName} module is routed, company-aware, and prepared for permissions and API integration.`}
          action={
            <Button asChild>
              <Link to={`/app/company/${companyId}/settings`}>
                Review company settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </SectionCard>
    </PageContainer>
  );
}
