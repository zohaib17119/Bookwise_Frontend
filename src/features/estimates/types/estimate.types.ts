import type { BaseEntityListParams } from "@/features/shared/types/common";
import type {
  DiscountType,
  DocumentLineInput,
  DocumentTotals,
} from "@/features/shared/types/documents";

export type EstimateStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export interface EstimateLine extends DocumentLineInput {
  id?: string;
}

export interface Estimate {
  id: string;
  estimateNumber?: string | null;
  referenceNumber?: string | null;
  customerId: string;
  customerName?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  currencyCode?: string | null;
  exchangeRate?: string | null;
  notes?: string | null;
  terms?: string | null;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  status?: EstimateStatus | null;
  lines: EstimateLine[];
  totals?: DocumentTotals | null;
}

export interface EstimateListParams extends BaseEntityListParams {
  status?: string;
  customerId?: string;
}

export interface EstimatePayload {
  customerId: string;
  estimateNumber?: string;
  referenceNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  currencyCode?: string;
  exchangeRate?: string;
  notes?: string;
  terms?: string;
  discountType?: DiscountType;
  discountValue?: number | null;
  lines: EstimateLine[];
}
