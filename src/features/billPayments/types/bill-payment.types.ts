import type { BaseEntityListParams } from "@/features/shared/types/common";
import type { AllocationEntry } from "@/features/shared/types/documents";

export interface BillPayment {
  id: string;
  vendorId: string;
  vendorName?: string | null;
  paymentDate?: string | null;
  paymentMethod: string;
  referenceNumber?: string | null;
  amount: number;
  unappliedAmount?: number | null;
  currencyCode?: string | null;
  notes?: string | null;
  allocations?: AllocationEntry[];
}

export interface BillPaymentListParams extends BaseEntityListParams {
  vendorId?: string;
}

export interface BillPaymentPayload {
  vendorId: string;
  paymentDate?: string;
  paymentMethod: string;
  referenceNumber?: string;
  amount: number;
  notes?: string;
}

export interface BillPaymentAllocationPayload {
  allocations: Array<{
    billId: string;
    amount: number;
  }>;
}
