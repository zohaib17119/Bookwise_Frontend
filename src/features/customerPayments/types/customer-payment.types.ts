import type { BaseEntityListParams } from "@/features/shared/types/common";
import type { AllocationEntry } from "@/features/shared/types/documents";

export interface CustomerPaymentAllocationInvoice {
  id: string;
  invoiceNumber?: string | null;
  status?: string | null;
  amountPaid?: string | number | null;
  amountDue?: string | number | null;
}

/** API allocation shape from customer payment detail/list. */
export interface CustomerPaymentAllocation {
  id?: string;
  invoiceId?: string;
  documentId?: string;
  documentNumber?: string;
  amount?: string | number | null;
  allocatedAmount?: string | number | null;
  amountDue?: string | number | null;
  invoice?: CustomerPaymentAllocationInvoice | null;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  customerName?: string | null;
  paymentDate?: string | null;
  paymentMethod: string;
  referenceNumber?: string | null;
  amount: string | number;
  unappliedAmount?: string | number | null;
  currencyCode?: string | null;
  notes?: string | null;
  allocations?: Array<CustomerPaymentAllocation | AllocationEntry>;
}

export interface CustomerPaymentListParams extends BaseEntityListParams {
  customerId?: string;
}

export interface CustomerPaymentPayload {
  customerId: string;
  paymentDate?: string;
  paymentMethod: string;
  referenceNumber?: string;
  currencyCode?: string;
  exchangeRate?: string;
  amount: string;
  notes?: string;
  allocations?: Array<{
    invoiceId: string;
    amount: string;
  }>;
}

export interface CustomerPaymentAllocationPayload {
  allocations: Array<{
    invoiceId: string;
    amount: string;
  }>;
}
