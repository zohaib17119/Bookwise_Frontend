import { useMutation, useQuery } from "@tanstack/react-query";
import {
  allocateCustomerPayment,
  createCustomerPayment,
  getCustomerPayment,
  getCustomerPayments,
} from "@/features/customerPayments/api/customer-payments.api";
import type {
  CustomerPaymentAllocationPayload,
  CustomerPaymentListParams,
  CustomerPaymentPayload,
} from "@/features/customerPayments/types/customer-payment.types";
import { queryClient } from "@/lib/query/query-client";

function invalidateCustomerPaymentQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["companies", companyId, "customer-payments"],
    }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "invoices"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
  ]);
}

export function useCustomerPayments(
  companyId: string | undefined,
  params: CustomerPaymentListParams,
) {
  return useQuery({
    queryKey: ["companies", companyId, "customer-payments", params],
    queryFn: () => getCustomerPayments(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useCustomerPayment(companyId: string | undefined, paymentId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "customer-payments", paymentId],
    queryFn: () => getCustomerPayment(companyId!, paymentId!),
    enabled: Boolean(companyId && paymentId),
  });
}

export function useCreateCustomerPayment(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: CustomerPaymentPayload) =>
      createCustomerPayment(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateCustomerPaymentQueries(companyId);
    },
  });
}

export function useAllocateCustomerPayment(companyId: string | undefined) {
  return useMutation({
    mutationFn: ({
      paymentId,
      payload,
    }: {
      paymentId: string;
      payload: CustomerPaymentAllocationPayload;
    }) => allocateCustomerPayment(paymentId, payload),
    onSuccess: async () => {
      if (companyId) await invalidateCustomerPaymentQueries(companyId);
    },
  });
}
