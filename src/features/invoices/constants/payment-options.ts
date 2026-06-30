export const INVOICE_PAYMENT_OPTIONS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
] as const;

export type InvoicePaymentOption = (typeof INVOICE_PAYMENT_OPTIONS)[number]["value"];

export function formatPaymentOptions(options: string[] | null | undefined): string {
  if (!options?.length) return "";
  return options
    .map(
      (option) =>
        INVOICE_PAYMENT_OPTIONS.find((entry) => entry.value === option)?.label ?? option,
    )
    .join(", ");
}
