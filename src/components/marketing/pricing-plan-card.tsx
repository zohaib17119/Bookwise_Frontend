import { Button } from "@/components/ui/button";
import type { PricingPlan } from "@/features/pricing/types/pricing.types";

interface PricingPlanCardProps {
  plan: PricingPlan;
}

export function PricingPlanCard({ plan }: PricingPlanCardProps) {
  return (
    <article className="surface flex h-full flex-col p-6">
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            {plan.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            ) : null}
          </div>
          {plan.badge ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {plan.badge}
            </span>
          ) : null}
        </div>

        <div className="mt-6">
          <p className="text-3xl font-semibold tracking-tight">
            ${plan.priceUsd}
            <span className="ml-1 text-base font-medium text-muted-foreground">
              / {plan.billingInterval}
            </span>
          </p>
          {plan.localCurrency && plan.localPrice ? (
            <p className="mt-2 text-sm text-muted-foreground">
              ≈ {plan.localCurrency} {plan.localPrice} / {plan.billingInterval}
              {plan.isApproximate ? " (approx.)" : ""}
            </p>
          ) : null}
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            {plan.note || "Billed in USD"}
          </p>
        </div>

        {plan.features?.length ? (
          <ul className="mt-6 space-y-2 text-sm text-slate-700">
            {plan.features.map((feature) => (
              <li key={feature}>• {feature}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-6 flex gap-3">
        <Button className="flex-1" type="button">
          {plan.primaryCtaLabel || "Get started"}
        </Button>
        <Button className="flex-1" type="button" variant="secondary">
          {plan.secondaryCtaLabel || "Contact sales"}
        </Button>
      </div>
    </article>
  );
}
