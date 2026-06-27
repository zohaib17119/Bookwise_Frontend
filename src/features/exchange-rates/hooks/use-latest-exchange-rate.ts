import { useQuery } from "@tanstack/react-query";
import { getLatestExchangeRate } from "@/features/exchange-rates/api/exchange-rates.api";

export function useLatestExchangeRate(
  companyId: string | undefined,
  targetCurrencyCode: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["companies", companyId, "exchange-rates", "latest", targetCurrencyCode],
    queryFn: () => getLatestExchangeRate(companyId!, targetCurrencyCode!),
    enabled: Boolean(companyId && targetCurrencyCode && enabled),
    retry: false,
    staleTime: 60_000,
  });
}
