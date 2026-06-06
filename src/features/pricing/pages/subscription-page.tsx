import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { usePricingPlans } from "@/features/pricing/hooks/use-pricing";

export function SubscriptionPage() {
  const pricingQuery = usePricingPlans();
  const primaryPlan = pricingQuery.data?.[0];

  return (
    <PageContainer
      header={
        <PageHeader
          description="Subscription management placeholder aligned with future Stripe or Paddle checkout flows."
          eyebrow="Billing"
          title="Subscription"
        />
      }
    >
      <div className="surface p-6">
        <p className="text-sm text-muted-foreground">Current plan</p>
        <h2 className="mt-2 text-2xl font-semibold">{primaryPlan?.name || "Starter"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Billing source of truth is USD. Local display remains approximate for convenience only.
        </p>
        <div className="mt-6">
          <EmptyState
            action={
              <Button asChild>
                <Link to="/pricing">Review pricing</Link>
              </Button>
            }
            description="Checkout and plan-change workflows can plug into this route later."
            title="Subscription portal foundation ready"
          />
        </div>
      </div>
    </PageContainer>
  );
}
