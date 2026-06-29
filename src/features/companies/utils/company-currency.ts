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

/** True when document currency differs from company base currency. */
export function needsDocumentExchangeRate(
  documentCurrency: string | undefined,
  baseCurrency: string,
): boolean {
  const doc = (documentCurrency || baseCurrency).trim().toUpperCase();
  return doc !== baseCurrency.trim().toUpperCase();
}

/**
 * ExchangeRate table stores "1 base = rate target". Document field uses
 * "1 document = ___ base" (matches backend convertToBase: tx * rate = base).
 */
export function exchangeRateTableToDocumentRate(tableRate: string | number): string {
  const numeric = Number(tableRate);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "";
  }
  return (1 / numeric).toFixed(8);
}

/**
 * Convert an item price stored in base currency into document currency for a line default.
 * Applied only when an item is selected — not retroactively when the rate changes later.
 * Mirrors backend convertFromBase: documentAmount = baseAmount / exchangeRate.
 */
export function convertBasePriceToDocumentPrice(
  basePrice: number,
  exchangeRate: string | number | undefined,
  documentCurrency: string,
  baseCurrency: string,
): number {
  if (!needsDocumentExchangeRate(documentCurrency, baseCurrency)) {
    return basePrice;
  }
  const rate = Number(exchangeRate);
  if (!Number.isFinite(rate) || rate <= 0) {
    return basePrice;
  }
  return Math.round((basePrice / rate + Number.EPSILON) * 10000) / 10000;
}
