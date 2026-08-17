const JOURNAL_SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  INVOICE: "Invoice",
  BILL: "Bill",
  BILL_RECEIVE: "Bill receive",
  CUSTOMER_PAYMENT: "Customer payment",
  BILL_PAYMENT: "Bill payment",
  EXPENSE: "Expense",
  WITHHOLDING_TAX: "Withholding tax",
  TAX_PAYMENT: "Tax payment",
};

export function formatJournalSourceModule(sourceModule?: string | null): string {
  if (!sourceModule) return "Manual";
  return JOURNAL_SOURCE_LABELS[sourceModule] ?? sourceModule.replace(/_/g, " ");
}
