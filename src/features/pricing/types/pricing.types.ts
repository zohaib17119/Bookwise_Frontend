export interface PricingPlan {
  id: string;
  name: string;
  description?: string | null;
  priceUsd: number;
  billingInterval: string;
  localCurrency?: string | null;
  localPrice?: number | null;
  isApproximate?: boolean;
  note?: string | null;
  badge?: string | null;
  features?: string[];
  primaryCtaLabel?: string | null;
  secondaryCtaLabel?: string | null;
}
