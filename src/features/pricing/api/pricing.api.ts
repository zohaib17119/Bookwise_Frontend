import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type { PricingPlan } from "@/features/pricing/types/pricing.types";

export async function getPricingPlans() {
  const { data } = await apiClient.get<PricingPlan[] | { data: PricingPlan[] }>("/pricing");
  return extractListData(data);
}
