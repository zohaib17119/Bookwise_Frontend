import type { Company } from "@/features/companies/types/company.types";

type CompanyLike =
  | Pick<Company, "countryCode" | "complianceModule" | "zatcaConfig">
  | null
  | undefined;

/** ZATCA settings/nav — Saudi Arabia companies (onboarding available). */
export function canShowZatcaSettings(company: CompanyLike): boolean {
  return (company?.countryCode || "").toUpperCase() === "SA";
}

/** @deprecated Prefer canShowZatcaSettings or canUseZatcaReporting */
export function canShowZatca(company: CompanyLike): boolean {
  return canShowZatcaSettings(company);
}

/** Invoice ZATCA column / retry / submit chrome — only when reporting is enabled. */
export function canUseZatcaReporting(company: CompanyLike): boolean {
  return (
    canShowZatcaSettings(company) && Boolean(company?.zatcaConfig?.isEnabled)
  );
}

/** Pakistan FBR / manual tax-reported column. */
export function canShowFbr(company: CompanyLike): boolean {
  return (company?.countryCode || "").toUpperCase() === "PK";
}

/** Any country-specific e-invoicing settings entry point. */
export function canShowCountryCompliance(company: CompanyLike): boolean {
  return canShowZatcaSettings(company) || canShowFbr(company);
}
