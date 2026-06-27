import { useQuery } from "@tanstack/react-query";
import { getCurrencies } from "@/features/currencies/api/currencies.api";

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: getCurrencies,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
