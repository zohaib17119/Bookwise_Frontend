import { useMutation, useQuery } from "@tanstack/react-query";
import {
  allocateBillPayment,
  createBillPayment,
  getBillPayment,
  getBillPayments,
} from "@/features/billPayments/api/bill-payments.api";
import type {
  BillPaymentAllocationPayload,
  BillPaymentListParams,
  BillPaymentPayload,
} from "@/features/billPayments/types/bill-payment.types";
import { queryClient } from "@/lib/query/query-client";

function invalidateBillPaymentQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "bill-payments"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "bills"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
  ]);
}

export function useBillPayments(
  companyId: string | undefined,
  params: BillPaymentListParams,
) {
  return useQuery({
    queryKey: ["companies", companyId, "bill-payments", params],
    queryFn: () => getBillPayments(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useBillPayment(companyId: string | undefined, paymentId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "bill-payments", paymentId],
    queryFn: () => getBillPayment(companyId!, paymentId!),
    enabled: Boolean(companyId && paymentId),
  });
}

export function useCreateBillPayment(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: BillPaymentPayload) => createBillPayment(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateBillPaymentQueries(companyId);
    },
  });
}

export function useAllocateBillPayment(companyId: string | undefined) {
  return useMutation({
    mutationFn: ({
      paymentId,
      payload,
    }: {
      paymentId: string;
      payload: BillPaymentAllocationPayload;
    }) => allocateBillPayment(paymentId, payload),
    onSuccess: async () => {
      if (companyId) await invalidateBillPaymentQueries(companyId);
    },
  });
}
