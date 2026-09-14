import type { Company } from "@/features/companies/types/company.types";

type CompanyLike =
  | Pick<Company, "countryCode" | "complianceModule" | "zatcaConfig" | "fbrConfig">
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

/** Pakistan FBR settings / nav (country gate only; config may still be disabled). */
export function canShowFbrSettings(company: CompanyLike): boolean {
  return (company?.countryCode || "").toUpperCase() === "PK";
}

/** Pakistan FBR / manual tax-reported column. */
export function canShowFbr(company: CompanyLike): boolean {
  return canShowFbrSettings(company);
}

/** True when company opted into FBR Digital Invoicing (live API may still be pending). */
export function canUseFbrDigitalInvoicing(company: CompanyLike): boolean {
  return canShowFbrSettings(company) && Boolean(company?.fbrConfig?.isEnabled);
}

/** Any country-specific e-invoicing settings entry point. */
export function canShowCountryCompliance(company: CompanyLike): boolean {
  return canShowZatcaSettings(company) || canShowFbrSettings(company);
}
