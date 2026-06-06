import { useQuery } from "@tanstack/react-query";
import { getPricingPlans } from "@/features/pricing/api/pricing.api";

export function usePricingPlans() {
  return useQuery({
    queryKey: ["pricing"],
    queryFn: getPricingPlans,
    staleTime: 300_000,
  });
}
