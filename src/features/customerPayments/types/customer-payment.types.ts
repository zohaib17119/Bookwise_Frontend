import type { BaseEntityListParams } from "@/features/shared/types/common";
import type { AllocationEntry } from "@/features/shared/types/documents";

export interface CustomerPayment {
  id: string;
  customerId: string;
  customerName?: string | null;
  paymentDate?: string | null;
  paymentMethod: string;
  referenceNumber?: string | null;
  amount: number;
  unappliedAmount?: number | null;
  currencyCode?: string | null;
  notes?: string | null;
  allocations?: AllocationEntry[];
}

export interface CustomerPaymentListParams extends BaseEntityListParams {
  customerId?: string;
}

export interface CustomerPaymentPayload {
  customerId: string;
  paymentDate?: string;
  paymentMethod: string;
  referenceNumber?: string;
  amount: string;
  notes?: string;
}

export interface CustomerPaymentAllocationPayload {
  allocations: Array<{
    invoiceId: string;
    amount: string;
  }>;
}
