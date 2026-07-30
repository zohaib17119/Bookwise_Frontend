import { useQuery } from "@tanstack/react-query";
import { listCountryPacks } from "../api/country-packs.api";

export function useCountryPacks() {
  return useQuery({
    queryKey: ["country-packs"],
    queryFn: listCountryPacks,
    staleTime: 60 * 60 * 1000,
  });
}
