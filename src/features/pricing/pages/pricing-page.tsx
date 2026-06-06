import { PricingHero } from "@/components/marketing/pricing-hero";
import { PricingPlanCard } from "@/components/marketing/pricing-plan-card";
import { ErrorState } from "@/components/shared/error-state";
import { usePricingPlans } from "@/features/pricing/hooks/use-pricing";

export function PricingPage() {
  const pricingQuery = usePricingPlans();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc,#eef2ff)] px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-12">
        <PricingHero />

        {pricingQuery.error ? (
          <ErrorState
            title="Unable to load pricing"
            description={pricingQuery.error.message}
          />
        ) : pricingQuery.isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="surface h-[340px] animate-pulse" />
            <div className="surface h-[340px] animate-pulse" />
            <div className="surface h-[340px] animate-pulse" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {(pricingQuery.data ?? []).map((plan) => (
              <PricingPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
