/** Approximate WHT for form preview; server recalculates on save. */

export type WhtBasePreview = "SUBTOTAL" | "TAXABLE" | "TAX_AMOUNT" | "TOTAL";

export function previewWhtAmount(input: {
  enabled?: boolean;
  rate?: string | number | null;
  base?: WhtBasePreview | string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}): number {
  if (!input.enabled) return 0;
  const rate = Number(input.rate) || 0;
  if (rate <= 0) return 0;

  let baseAmount = 0;
  switch (input.base) {
    case "SUBTOTAL":
      baseAmount = input.subtotal;
      break;
    case "TAXABLE":
      baseAmount = Math.max(input.subtotal - input.discount, 0);
      break;
    case "TAX_AMOUNT":
      baseAmount = input.tax;
      break;
    case "TOTAL":
      baseAmount = input.total;
      break;
    default:
      baseAmount = 0;
  }

  const raw = Math.round(((baseAmount * rate) / 100) * 100) / 100;
  return Math.min(Math.max(raw, 0), input.total);
}

export function previewNetSettlement(total: number, whtAmount: number, addsToCash: boolean): number {
  const rounded = Math.round((addsToCash ? total + whtAmount : total - whtAmount) * 100) / 100;
  return Math.max(rounded, 0);
}
