import type { BaseEntityListParams } from "@/features/shared/types/common";
import type {
  DiscountType,
  DocumentLineInput,
  DocumentTotals,
} from "@/features/shared/types/documents";

export type BillStatus =
  | "DRAFT"
  | "OPEN"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID"
  | "CANCELLED";

export interface BillLine extends DocumentLineInput {
  id?: string;
}

export interface Bill {
  id: string;
  billNumber?: string | null;
  referenceNumber?: string | null;
  vendorId: string;
  vendorName?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  currencyCode?: string | null;
  notes?: string | null;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  status?: BillStatus | null;
  amountPaid?: number | null;
  amountDue?: number | null;
  lines: BillLine[];
  totals?: DocumentTotals | null;
}

export interface BillListParams extends BaseEntityListParams {
  status?: string;
  vendorId?: string;
}

export interface BillPayload {
  vendorId: string;
  billNumber?: string;
  referenceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  currencyCode?: string;
  notes?: string;
  discountType?: DiscountType;
  discountValue?: number | null;
  lines: BillLine[];
}
