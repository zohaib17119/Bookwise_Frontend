import type { BaseEntityListParams } from "@/features/shared/types/common";
import type { AllocationEntry } from "@/features/shared/types/documents";

export interface BillPaymentAllocationBill {
  id: string;
  billNumber?: string | null;
  status?: string | null;
  amountPaid?: string | number | null;
  amountDue?: string | number | null;
}

export interface BillPaymentAllocation {
  id?: string;
  billId?: string;
  documentId?: string;
  documentNumber?: string;
  amount?: string | number | null;
  allocatedAmount?: string | number | null;
  amountDue?: string | number | null;
  bill?: BillPaymentAllocationBill | null;
}

export interface BillPayment {
  id: string;
  vendorId: string;
  vendorName?: string | null;
  paymentDate?: string | null;
  paymentMethod: string;
  referenceNumber?: string | null;
  amount: string | number;
  unappliedAmount?: string | number | null;
  currencyCode?: string | null;
  notes?: string | null;
  allocations?: Array<BillPaymentAllocation | AllocationEntry>;
}

export interface BillPaymentListParams extends BaseEntityListParams {
  vendorId?: string;
}

export interface BillPaymentPayload {
  vendorId: string;
  paymentDate?: string;
  paymentMethod: string;
  referenceNumber?: string;
  currencyCode?: string;
  exchangeRate?: string;
  amount: string;
  notes?: string;
}

export interface BillPaymentAllocationPayload {
  allocations: Array<{
    billId: string;
    amount: string;
  }>;
}
