export type DiscountType = "FIXED" | "PERCENTAGE";

export interface DocumentLineInput {
  itemId?: string | null;
  description: string;
  quantity: string;
  unitPrice?: string | null;
  unitCost?: string | null;
  discountType?: DiscountType | null;
  discountValue?: string | null;
  taxCodeId?: string | null;
  taxRate?: string | null;
  expenseAccountId?: string | null;
}

export interface DocumentTotals {
  subtotal?: string | null;
  discountTotal?: string | null;
  taxTotal?: string | null;
  total?: string | null;
}

export interface AllocationEntry {
  documentId: string;
  documentNumber: string;
  documentDate?: string | null;
  dueDate?: string | null;
  total?: string | null;
  amountDue?: string | null;
  allocatedAmount: string;
}

export interface PaymentSummary {
  amount: string;
  unappliedAmount?: string | null;
  allocations?: AllocationEntry[];
}
