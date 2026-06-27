import type { Company } from "@/features/companies/types/company.types";

/** Company base/reporting currency from API fields (never use legacy `company.currency`). */
export function getCompanyBaseCurrency(
  company: Pick<Company, "baseCurrencyCode" | "currencyCode"> | null | undefined,
  fallback = "USD",
): string {
  return company?.baseCurrencyCode ?? company?.currencyCode ?? fallback;
}

/** Include exchangeRate in API payload only when document currency differs from base. */
export function resolveDocumentExchangeRate(
  company: Pick<Company, "baseCurrencyCode" | "currencyCode"> | null | undefined,
  currencyCode: string | undefined,
  exchangeRate: string | undefined,
): string | undefined {
  const baseCurrency = getCompanyBaseCurrency(company);
  const documentCurrency = (currencyCode || baseCurrency).trim().toUpperCase();
  if (documentCurrency === baseCurrency.toUpperCase()) {
    return undefined;
  }
  const rate = exchangeRate?.trim();
  return rate ? rate : undefined;
}
