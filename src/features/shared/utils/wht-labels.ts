export type WhtHeldBy = "COMPANY" | "COUNTERPARTY";
export type WhtDocumentKind = "invoice" | "bill";

export const WHT_TYPE_HINT =
  "Income WHT is withheld on your payment or profit. Sales tax WHT is withheld on the VAT/sales-tax portion only.";

export const WHT_BASE_HINTS: Record<"SUBTOTAL" | "TAXABLE" | "TAX_AMOUNT" | "TOTAL", string> = {
  SUBTOTAL: "Before document discount is applied.",
  TAXABLE: "Subtotal minus discount — amount subject to tax.",
  TAX_AMOUNT: "Only the VAT/sales tax amount on this document.",
  TOTAL: "Grand total including tax.",
};

export function defaultWhtHeldBy(document: WhtDocumentKind): WhtHeldBy {
  return document === "invoice" ? "COUNTERPARTY" : "COMPANY";
}

/** True when the cash receiver collects WHT on top of the document total. */
export function whtSettlementAddsToCash(
  heldBy: WhtHeldBy | "" | null | undefined,
  document: WhtDocumentKind,
): boolean {
  const resolved = heldBy || defaultWhtHeldBy(document);
  return document === "invoice" ? resolved === "COMPANY" : resolved === "COUNTERPARTY";
}

export function whtHeldByLabel(
  heldBy: WhtHeldBy | "" | null | undefined,
  document: WhtDocumentKind,
  companyName?: string | null,
): string {
  const resolved = heldBy || defaultWhtHeldBy(document);
  if (resolved === "COMPANY") {
    return companyName ? `Held by ${companyName}` : "Held by us";
  }
  return document === "invoice" ? "Held by customer" : "Held by vendor";
}

export function whtHeldByHint(
  heldBy: WhtHeldBy | "" | null | undefined,
  document: WhtDocumentKind,
  companyName?: string | null,
): string {
  const resolved = heldBy || defaultWhtHeldBy(document);
  const company = companyName ?? "your company";
  if (resolved === "COUNTERPARTY") {
    if (document === "invoice") {
      return `The customer withholds WHT from your invoice and pays less (total − WHT). You have a WHT receivable to claim.`;
    }
    return `The vendor collects WHT on top of the bill. You pay more (total + WHT). You have a WHT receivable to claim.`;
  }
  if (document === "invoice") {
    return `${company} collects WHT from the customer on top of the invoice. The customer pays more (total + WHT). This creates a WHT payable you must remit.`;
  }
  return `${company} withholds WHT from the vendor's payment and pays less (total − WHT). This creates a WHT payable you must remit.`;
}

export function whtNetLabel(
  heldBy: WhtHeldBy | "" | null | undefined,
  document: WhtDocumentKind,
): string {
  const resolved = heldBy || defaultWhtHeldBy(document);
  if (document === "invoice") {
    return resolved === "COUNTERPARTY" ? "Net receivable" : "Amount due (incl. WHT)";
  }
  return resolved === "COMPANY" ? "Net payable" : "Amount to pay (incl. WHT)";
}

export function whtTypeShortLabel(type?: string | null): string {
  if (type === "INCOME") return "Income WHT";
  if (type === "SALES_TAX") return "Sales tax WHT";
  return "WHT";
}

export function whtSummaryHeldByLabel(heldBy: WhtHeldBy): string {
  return heldBy === "COMPANY" ? "Held by us" : "Held by customer/vendor";
}

export function taxBalanceHint(kind: "payable" | "receivable", taxKind: "vat" | "incomeWht" | "salesTaxWht"): string {
  const taxLabel =
    taxKind === "vat" ? "VAT/sales tax" : taxKind === "incomeWht" ? "Income WHT" : "Sales tax WHT";
  if (kind === "payable") {
    return `${taxLabel} payable: amounts your company withheld and must pay to the tax authority.`;
  }
  return `${taxLabel} receivable: amounts withheld by customers/vendors that you can claim or collect.`;
}
