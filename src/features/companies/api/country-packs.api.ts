import { apiClient } from "@/lib/api/client";

export type CountryPackSummary = {
  countryCode: string;
  displayName: string;
  defaultCurrency: string;
  taxLabel: string;
  complianceModule: "ZATCA" | "FBR" | null;
  features: {
    zatca?: boolean;
    fbr?: boolean;
    pos?: boolean;
    arabic?: boolean;
  };
};

export async function listCountryPacks() {
  const { data } = await apiClient.get<CountryPackSummary[]>("/country-packs");
  return data;
}