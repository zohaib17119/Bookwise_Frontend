import type { BaseEntityListParams } from "@/features/shared/types/common";
import type {
  DiscountType,
  DocumentLineInput,
  DocumentTotals,
} from "@/features/shared/types/documents";

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID"
  | "CANCELLED";

export interface InvoiceLine extends DocumentLineInput {
  id?: string;
  taxCodeId?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber?: string | null;
  referenceNumber?: string | null;
  customerId: string;
  customerName?: string | null;
  estimateId?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  currencyCode?: string | null;
  exchangeRate?: string | null;
  notes?: string | null;
  terms?: string | null;
  discountType?: DiscountType | null;
  discountValue?: string | null;
  status?: InvoiceStatus | null;
  rawStatus?: InvoiceStatus | null;
  total?: string | null;
  amountPaid?: string | null;
  amountDue?: string | null;
  lines: InvoiceLine[];
  totals?: DocumentTotals | null;
}

export interface InvoiceListParams extends BaseEntityListParams {
  status?: string;
  customerId?: string;
}

export interface InvoicePayload {
  customerId: string;
  estimateId?: string;
  invoiceNumber?: string;
  referenceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  currencyCode?: string;
  exchangeRate?: string;
  notes?: string;
  terms?: string;
  discountType?: DiscountType;
  discountValue?: string;
  lines: InvoiceLine[];
}
