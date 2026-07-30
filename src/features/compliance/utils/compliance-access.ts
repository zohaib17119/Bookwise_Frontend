import type { Company } from "@/features/companies/types/company.types";

type CompanyLike = Pick<Company, "countryCode" | "complianceModule"> | null | undefined;

/** ZATCA settings/nav/invoice chrome — Saudi Arabia companies only. */
export function canShowZatca(company: CompanyLike): boolean {
  return (company?.countryCode || "").toUpperCase() === "SA";
}

/** Future: Pakistan FBR settings visibility. */
export function canShowFbr(company: CompanyLike): boolean {
  return (company?.countryCode || "").toUpperCase() === "PK";
}

/** Any country-specific e-invoicing settings entry point. */
export function canShowCountryCompliance(company: CompanyLike): boolean {
  return canShowZatca(company) || canShowFbr(company);
}
