export type DiscountType = "FIXED" | "PERCENTAGE";

export interface DocumentLineInput {
  itemId?: string | null;
  itemName?: string | null;
  item?: {
    id?: string;
    name?: string;
    hsCode?: string | null;
    itemCode?: string | null;
  } | null;
  description: string;
  quantity: string;
  unitPrice?: string | null;
  unitCost?: string | null;
  discountType?: DiscountType | null;
  discountValue?: string | null;
  taxCodeId?: string | null;
  taxCode?: string | null;
  taxName?: string | null;
  taxCodeRef?: { id?: string; code?: string; name?: string } | null;
  taxRate?: string | null;
  expenseAccountId?: string | null;
  hsCode?: string | null;
  itemCode?: string | null;
}

export interface DocumentTotals {
  subtotal?: string | null;
  discountTotal?: string | null;
  taxTotal?: string | null;
  total?: string | null;
  whtAmount?: string | null;
  netSettlementAmount?: string | null;
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
